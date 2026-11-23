from datetime import datetime

from sqlalchemy import Boolean, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import CuidPrimaryKeyMixin, TimestampMixin


class User(CuidPrimaryKeyMixin, TimestampMixin, Base):
    """BidAgent kullanıcı modeli."""

    __tablename__ = "User"

    email: Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False,
    )

    name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    surname: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    image: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    password: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    temp_password: Mapped[bool] = mapped_column(
    "tempPassword",
    Boolean,
    default=False,
    server_default=text("false"),
    nullable=False,
)
