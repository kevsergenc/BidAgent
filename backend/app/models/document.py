from datetime import datetime, timezone

from sqlalchemy import ForeignKey, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import CuidPrimaryKeyMixin, UTCDateTime


class Document(CuidPrimaryKeyMixin, Base):
    """İhale dokümanı modeli."""

    __tablename__ = "Document"

    user_id: Mapped[str] = mapped_column(
        "userId",
        String,
        ForeignKey("User.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    file_name: Mapped[str] = mapped_column(
        "fileName",
        String,
        nullable=False,
    )

    file_size: Mapped[int] = mapped_column(
        "fileSize",
        Integer,
        nullable=False,
    )

    page_count: Mapped[int] = mapped_column(
    "pageCount",
    Integer,
    default=1,
    server_default=text("1"),
    nullable=False,
)

    created_at: Mapped[datetime] = mapped_column(
    "createdAt",
    UTCDateTime(),
    default=lambda: datetime.now(timezone.utc),
    nullable=False,
)