import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.agents.graph.agent_graph import run_agent


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/agent",
    tags=["Agent"],
)


class AgentAskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=5000)
    document_id: str = Field(min_length=1)


@router.post("/ask")
def ask_agent(
    request: AgentAskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = select(Document).where(
        Document.id == request.document_id,
        Document.user_id == current_user.id,
    )

    document = db.scalar(statement)

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Belge bulunamad? veya bu belgeye eri?im yetkiniz yok.",
        )

    try:
        result = run_agent(
            question=request.question,
            user_id=current_user.id,
            document_id=document.id,
        )

        if result.get("status") != "completed":
            logger.error(
                "Agent i?lemi tamamlanamad?. Status: %s, Error: %s",
                result.get("status"),
                result.get("error"),
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Agent i?lemi tamamlanamad?.",
            )

        return {
            "status": result.get("status"),
            "planned_activities": result.get("planned_activities", []),
            "answer": result.get("answer", ""),
            "sources": result.get("sources", []),
        }

    except HTTPException:
        raise

    except Exception as error:
        logger.exception("Agent API hatas?.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Soru i?lenirken beklenmeyen bir hata olu?tu.",
        ) from error
