from app.rag.rag_service import ask_document


def execute_generate_answer(
    question: str,
    user_id: str,
    document_id: str,
    retrieved_chunks=None,
) -> dict:
    """Generate an answer using shared or newly retrieved chunks."""

    return ask_document(
        question=question,
        user_id=user_id,
        document_id=document_id,
        retrieved_chunks=retrieved_chunks,
    )

