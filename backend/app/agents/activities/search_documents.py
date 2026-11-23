from app.core.config import get_settings
from app.rag.rag_service import retrieve_relevant_chunks


def execute_search_documents(
    question: str,
    user_id: str,
    document_id: str,
) -> dict:
    """Belgede ilgili metin parçalarını arar."""

    if not question or not question.strip():
        raise ValueError("Arama sorusu boş olamaz.")

    if not user_id or not document_id:
        raise ValueError("user_id ve document_id zorunludur.")

    settings = get_settings()

    chunks = retrieve_relevant_chunks(
        question=question,
        user_id=user_id,
        document_id=document_id,
        top_k=settings.rag_top_k,
    )

    sources = []

    for chunk in chunks:
        metadata = chunk.metadata

        sources.append({
            "page_number": metadata.get("page_number"),
            "chunk_index": metadata.get("chunk_index"),
            "source_file": metadata.get("source_file"),
        })

    return {
        "retrieved_chunks": chunks,
        "sources": sources,
        "chunk_count": len(chunks),
    }
