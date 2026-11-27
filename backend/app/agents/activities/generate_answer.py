from typing import Any

from app.rag.rag_service import ask_document


def execute_generate_answer(
    question: str,
    user_id: str,
    document_id: str,
    retrieved_chunks=None,
    analysis_context: dict[str, Any] | None = None,
) -> dict:
    """Generate an answer using retrieved chunks and prior agent analysis."""

    return ask_document(
        question=question,
        user_id=user_id,
        document_id=document_id,
        retrieved_chunks=retrieved_chunks,
        analysis_context=analysis_context,
    )


