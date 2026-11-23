import logging
import os
import shutil
from pathlib import Path

import pymupdf

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent

TESSERACT_PATH = Path(
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

TESSDATA_DIR = BACKEND_DIR / "storage" / "tessdata"


def configure_ocr() -> None:
    """Configure Tesseract paths for PDF OCR."""

    if TESSERACT_PATH.exists():
        os.environ["PATH"] = (
            str(TESSERACT_PATH.parent)
            + os.pathsep
            + os.environ.get("PATH", "")
        )

    if TESSDATA_DIR.exists():
        os.environ["TESSDATA_PREFIX"] = str(TESSDATA_DIR)

    if not TESSERACT_PATH.exists():
        raise RuntimeError(
            f"Tesseract bulunamadı: {TESSERACT_PATH}"
        )

    if not (TESSDATA_DIR / "tur.traineddata").exists():
        raise RuntimeError("Türkçe OCR dil dosyası bulunamadı.")

    if not (TESSDATA_DIR / "eng.traineddata").exists():
        raise RuntimeError("İngilizce OCR dil dosyası bulunamadı.")


def extract_pdf_pages(
    pdf_path: str | Path,
    force_ocr: bool = False,
    ocr_dpi: int = 200,
) -> list[dict]:
    """
    Extract text from every PDF page.

    Text-based pages use direct extraction.
    Scanned pages use Turkish and English OCR.

    Returns page-level text and metadata.
    """

    pdf_path = Path(pdf_path)

    if not pdf_path.exists():
        raise FileNotFoundError(
            f"PDF dosyası bulunamadı: {pdf_path}"
        )

    if pdf_path.suffix.lower() != ".pdf":
        raise ValueError("Yalnızca PDF dosyaları destekleniyor.")

    configure_ocr()

    results = []

    with pymupdf.open(pdf_path) as document:

        for page_index, page in enumerate(document):

            text = page.get_text("text").strip()
            extraction_method = "text"

            
            if force_ocr or len(text) < 30:

                text_page = page.get_textpage_ocr(
                    language="tur+eng",
                    dpi=ocr_dpi,
                    full=True,
                )

                ocr_text = page.get_text(
                    "text",
                    textpage=text_page,
                ).strip()

                if len(ocr_text) > len(text):
                    text = ocr_text
                    extraction_method = "ocr"

            results.append(
                {
                    "page_number": page_index + 1,
                    "text": text,
                    "extraction_method": extraction_method,
                    "character_count": len(text),
                    "source_file": pdf_path.name,
                }
            )

    logger.info(
        "PDF processing completed: %s (%s pages)",
        pdf_path.name,
        len(results),
    )

    return results
