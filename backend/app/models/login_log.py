from datetime import datetime, timezone

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import CuidPrimaryKeyMixin, UTCDateTime


class LoginLog(CuidPrimaryKeyMixin, Base):
    """Kullanıcı giriş geçmişi modeli."""

    __tablename__ = "LoginLog"

    user_id: Mapped[str] = mapped_column(
        "userId",
        String,
        ForeignKey("User.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )

    ip: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    user_agent: Mapped[str | None] = mapped_column(
        "userAgent",
        String,
        nullable=True,
    )

    login_at: Mapped[datetime] = mapped_column(
    "loginAt",
    UTCDateTime(),
    default=lambda: datetime.now(timezone.utc),
    nullable=False,
)
