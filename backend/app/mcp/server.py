import asyncio
import os
from typing import Any

from mcp.server import MCPServer
from sqlalchemy import select
from langchain_core.documents import Document

from app.db.session import SessionLocal
from app.models.document import Document as DatabaseDocument

from app.agents.activities.search_documents import execute_search_documents
from app.agents.activities.extract_requirements import execute_extract_requirements
from app.agents.activities.detect_risks import execute_detect_risks
from app.agents.activities.generate_answer import execute_generate_answer


server = MCPServer(
    name="BidAgent",
    version="1.0.0",
    instructions="BidAgent ihale dokümanı analiz araçlarını sunar.",
)


def get_authorized_context() -> tuple[str, str]:
    user_id = os.environ.get("BIDAGENT_MCP_USER_ID")
    document_id = os.environ.get("BIDAGENT_MCP_DOCUMENT_ID")

    if not user_id or not document_id:
        raise ValueError("MCP kullanıcı veya belge bağlamı bulunamadı.")

    db = SessionLocal()

    try:
        statement = select(DatabaseDocument).where(
            DatabaseDocument.id == document_id,
            DatabaseDocument.user_id == user_id,
        )
        document = db.scalar(statement)

        if document is None:
            raise PermissionError("Belgeye erişim yetkisi doğrulanamadı.")

        return user_id, document.id
    finally:
        db.close()


def deserialize_chunks(
    chunks: list[dict[str, Any]] | None,
) -> list[Document] | None:
    if chunks is None:
        return None

    documents = []

    for chunk in chunks:
        documents.append(
            Document(
                id=chunk.get("id"),
                page_content=chunk["page_content"],
                metadata=chunk.get("metadata", {}),
            )
        )

    return documents


@server.tool(
    name="search_documents",
    description="Yetkili kullanıcının ihale belgesinde soruyla ilgili bölümleri arar.",
)
def search_documents(question: str) -> dict[str, Any]:
    user_id, document_id = get_authorized_context()

    return execute_search_documents(
        question=question,
        user_id=user_id,
        document_id=document_id,
    )


@server.tool(
    name="extract_requirements",
    description="İhale teknik şartnamesindeki temel gereklilikleri çıkarır.",
)
def extract_requirements(
    question: str,
    retrieved_chunks: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    user_id, document_id = get_authorized_context()

    return execute_extract_requirements(
        question=question,
        user_id=user_id,
        document_id=document_id,
        retrieved_chunks=deserialize_chunks(retrieved_chunks),
    )


@server.tool(
    name="detect_risks",
    description="İhale dokümanındaki olası riskleri tespit eder.",
)
def detect_risks(
    question: str,
    retrieved_chunks: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    user_id, document_id = get_authorized_context()

    return execute_detect_risks(
        question=question,
        user_id=user_id,
        document_id=document_id,
        retrieved_chunks=deserialize_chunks(retrieved_chunks),
    )


@server.tool(
    name="generate_answer",
    description="İhale dokümanındaki bilgilere ve önceki analiz sonuçlarına dayanarak kaynaklı yanıt üretir.",
)

def generate_answer(
    question: str,
    retrieved_chunks: list[dict[str, Any]] | None = None,
    analysis_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    user_id, document_id = get_authorized_context()

    return execute_generate_answer(
        question=question,
        user_id=user_id,
        document_id=document_id,
        retrieved_chunks=deserialize_chunks(retrieved_chunks),
        analysis_context=analysis_context,
    )



async def main() -> None:
    await server.run_stdio_async()


if __name__ == "__main__":
    asyncio.run(main())
