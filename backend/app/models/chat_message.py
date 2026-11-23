from datetime import datetime, timezone

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import CuidPrimaryKeyMixin, UTCDateTime


class ChatMessage(CuidPrimaryKeyMixin, Base):
    """Belge üzerinden gerçekleştirilen sohbet mesajları."""

    __tablename__ = "ChatMessage"

    document_id: Mapped[str] = mapped_column(
        "documentId",
        String,
        ForeignKey("Document.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )

    sender: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    question: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    answer: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
    "createdAt",
    UTCDateTime(),
    default=lambda: datetime.now(timezone.utc),
    nullable=False,
)
