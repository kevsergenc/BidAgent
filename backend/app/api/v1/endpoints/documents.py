import logging
import shutil
import hashlib
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.rag.vectorstore.vector_store import (
    delete_document_vectors,
    index_document_chunks,
)
from app.services.pdf_processor import extract_pdf_pages
from app.services.text_splitter import split_pages_into_chunks


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)

BACKEND_DIR = Path(__file__).resolve().parents[4]
UPLOAD_DIR = BACKEND_DIR / "storage" / "uploads"

PROJECT_ROOT = BACKEND_DIR.parent
LEGACY_UPLOAD_DIR = PROJECT_ROOT / "uploads"


def calculate_file_hash(file_path: Path) -> str:
    """Dosyanın SHA-256 özetini hesaplar."""
    sha256 = hashlib.sha256()

    with file_path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            sha256.update(chunk)

    return sha256.hexdigest()


def find_duplicate_document(
    db: Session,
    user_id: str,
    file_hash: str,
):
    """Kullanıcının mevcut belgeleri arasında aynı PDF'yi arar."""

    documents = (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .all()
    )

    matches = []

    for document in documents:
        possible_paths = [
            UPLOAD_DIR / document.file_name,
            LEGACY_UPLOAD_DIR / document.file_name,
        ]

        for existing_path in possible_paths:
            if not existing_path.is_file():
                continue

            existing_hash = calculate_file_hash(existing_path)

            if existing_hash == file_hash:
                is_backend_file = existing_path.parent == UPLOAD_DIR
                matches.append((is_backend_file, document))
                break

    if not matches:
        return None

    matches.sort(key=lambda item: item[0], reverse=True)

    return matches[0][1]


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Dosya adı bulunamadı.",
        )

    original_name = Path(file.filename).name

    if Path(original_name).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Yalnızca PDF dosyaları yüklenebilir.",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid4().hex}.pdf"
    file_path = UPLOAD_DIR / stored_name

    document = None
    document_id = None
    indexing_started = False

    try:
        with file_path.open("wb") as destination:
            shutil.copyfileobj(file.file, destination)

        file_size = file_path.stat().st_size

        if file_size == 0:
            raise ValueError("Yüklenen PDF dosyası boş.")

        with file_path.open("rb") as uploaded_file:
            if uploaded_file.read(5) != b"%PDF-":
                raise ValueError("Geçerli bir PDF dosyası yükleyin.")

        file_hash = calculate_file_hash(file_path)

        duplicate_document = find_duplicate_document(
            db=db,
            user_id=current_user.id,
            file_hash=file_hash,
        )

        if duplicate_document is not None:
            file_path.unlink(missing_ok=True)

            return {
                "message": "Bu PDF daha önce yüklenmiş. Mevcut belge kullanılıyor.",
                "document_id": duplicate_document.id,
                "title": duplicate_document.title,
                "file_name": original_name,
                "page_count": duplicate_document.page_count,
                "chunk_count": 0,
                "duplicate": True,
            }

        pages = extract_pdf_pages(file_path)

        if not pages:
            raise ValueError("PDF içerisinde sayfa bulunamadı.")

        chunks = split_pages_into_chunks(
            pages=pages,
            chunk_size=1200,
            chunk_overlap=200,
        )

        if not chunks:
            raise ValueError(
                "PDF içerisinden indekslenecek metin çıkarılamadı."
            )

        document = Document(
            user_id=current_user.id,
            title=Path(original_name).stem,
            file_name=stored_name,
            file_size=file_size,
            page_count=len(pages),
        )

        db.add(document)
        db.flush()

        document_id = document.id

        db.commit()

        indexing_started = True

        indexed_count = index_document_chunks(
            chunks=chunks,
            user_id=current_user.id,
            document_id=document_id,
        )

        return {
            "message": "Belge başarıyla yüklendi ve indekslendi.",
            "document_id": document_id,
            "title": document.title,
            "file_name": original_name,
            "page_count": len(pages),
            "chunk_count": indexed_count,
            "duplicate": False,
        }

    except ValueError as error:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        logger.exception("Belge yükleme veya indeksleme başarısız.")

        db.rollback()

        if indexing_started and document_id:
            try:
                delete_document_vectors(
                    user_id=current_user.id,
                    document_id=document_id,
                )
            except Exception:
                logger.exception("ChromaDB temizliği başarısız.")

        if document is not None and document_id:
            try:
                existing_document = db.get(Document, document_id)

                if existing_document is not None:
                    db.delete(existing_document)
                    db.commit()

            except Exception:
                db.rollback()
                logger.exception("SQL belge kaydı temizlenemedi.")

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Belge yüklenirken veya indekslenirken hata oluştu.",
        ) from error

    finally:
        await file.close()



@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Belgeyi, ChromaDB vektörlerini ve PDF dosyasını sil."""

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
        .first()
    )

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Belge bulunamadı.",
        )

    if Path(document.file_name).name != document.file_name:
        raise HTTPException(
            status_code=400,
            detail="Geçersiz dosya yolu.",
        )

    file_path = UPLOAD_DIR / document.file_name
    legacy_file_path = LEGACY_UPLOAD_DIR / document.file_name

    existing_file = (
        file_path
        if file_path.is_file()
        else legacy_file_path
        if legacy_file_path.is_file()
        else None
    )

    try:
        delete_document_vectors(
            user_id=current_user.id,
            document_id=document.id,
        )

        db.delete(document)
        db.commit()

    except Exception as error:
        db.rollback()
        logger.exception("Belge silme işlemi başarısız.")

        raise HTTPException(
            status_code=500,
            detail="Belge silinirken hata oluştu.",
        ) from error

    if existing_file is not None:
        try:
            existing_file.unlink(missing_ok=True)
        except OSError:
            logger.exception(
                "Belge kaydı silindi ancak PDF dosyası silinemedi: %s",
                existing_file,
            )

    return {
        "message": "Belge ve indeksleri başarıyla silindi.",
        "document_id": document_id,
    }
