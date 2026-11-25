import hashlib
from functools import lru_cache
from pathlib import Path

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings

from app.core.config import get_settings


BACKEND_DIR = Path(__file__).resolve().parents[3]
CHROMA_DIR = BACKEND_DIR / "storage" / "chroma"

COLLECTION_NAME = "bidagent_documents"
EMBEDDING_MODEL = "embeddinggemma:latest"


@lru_cache(maxsize=1)
def get_vector_store() -> Chroma:
    """Return the persistent BidAgent ChromaDB collection."""

    CHROMA_DIR.mkdir(parents=True, exist_ok=True)

    settings = get_settings()

    embeddings = OllamaEmbeddings(
        model=EMBEDDING_MODEL,
        base_url=settings.ollama_base_url,
    )

    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=str(CHROMA_DIR),
    )


def build_chunk_id(
    user_id: str,
    document_id: str,
    page_number: int,
    chunk_index: int,
) -> str:
    """Create a stable and unique ID for each document chunk."""

    raw_id = (
        f"{user_id}:{document_id}:"
        f"{page_number}:{chunk_index}"
    )

    return hashlib.sha256(
        raw_id.encode("utf-8")
    ).hexdigest()


def delete_document_vectors(
    user_id: str,
    document_id: str,
) -> None:
    """Delete all indexed chunks belonging to one document."""

    vector_store = get_vector_store()

    vector_store.delete(
        where={
            "$and": [
                {"user_id": {"$eq": user_id}},
                {"document_id": {"$eq": document_id}},
            ]
        }
    )


def index_document_chunks(
    chunks: list[Document],
    user_id: str,
    document_id: str,
) -> int:
    """
    Index document chunks in ChromaDB.

    Existing vectors for the same user and document are replaced.
    """

    if not user_id or not document_id:
        raise ValueError(
            "user_id ve document_id zorunludur."
        )

    if not chunks:
        raise ValueError(
            "Vektör veritabanına kaydedilecek chunk bulunamadı."
        )

    prepared_documents = []
    chunk_ids = []

    for chunk in chunks:

        metadata = {
            **chunk.metadata,
            "user_id": user_id,
            "document_id": document_id,
        }

        page_number = int(metadata["page_number"])
        chunk_index = int(metadata["chunk_index"])

        prepared_documents.append(
            Document(
                page_content=chunk.page_content,
                metadata=metadata,
            )
        )

        chunk_ids.append(
            build_chunk_id(
                user_id=user_id,
                document_id=document_id,
                page_number=page_number,
                chunk_index=chunk_index,
            )
        )

    vector_store = get_vector_store()

    delete_document_vectors(
        user_id=user_id,
        document_id=document_id,
    )

    vector_store.add_documents(
        documents=prepared_documents,
        ids=chunk_ids,
    )

    return len(prepared_documents)


def search_document_chunks(
    query: str,
    user_id: str,
    document_id: str,
    k: int = 5,
) -> list[Document]:
    """Search only within the specified user's document."""

    if not query.strip():
        raise ValueError("Arama sorgusu boş olamaz.")

    if not user_id or not document_id:
        raise ValueError(
            "user_id ve document_id zorunludur."
        )

    if k < 1:
        raise ValueError("k en az 1 olmalıdır.")

    vector_store = get_vector_store()

    return vector_store.similarity_search(
        query=query,
        k=k,
        filter={
            "$and": [
                {"user_id": {"$eq": user_id}},
                {"document_id": {"$eq": document_id}},
            ]
        },
    )
def search_document_chunks_with_scores(
    query: str,
    user_id: str,
    document_id: str,
    k: int = 5,
) -> list[tuple[Document, float]]:
    """Search document chunks and return their raw distance scores."""

    if not query.strip():
        raise ValueError("Arama sorgusu boş olamaz.")

    if not user_id or not document_id:
        raise ValueError(
            "user_id ve document_id zorunludur."
        )

    if k < 1:
        raise ValueError("k en az 1 olmalıdır.")

    vector_store = get_vector_store()

    return vector_store.similarity_search_with_score(
        query=query,
        k=k,
        filter={
            "$and": [
                {"user_id": {"$eq": user_id}},
                {"document_id": {"$eq": document_id}},
            ]
        },
    )
