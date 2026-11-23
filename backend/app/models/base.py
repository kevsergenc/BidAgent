import cuid

from datetime import datetime, timezone

from sqlalchemy import Integer, String
from sqlalchemy.types import TypeDecorator
from sqlalchemy.orm import Mapped, mapped_column


class UTCDateTime(TypeDecorator):
    """UTC datetime değerlerini SQLite'ta Unix milisaniye olarak saklar."""

    impl = Integer
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None

        if not isinstance(value, datetime):
            raise TypeError("UTCDateTime yalnızca datetime kabul eder.")

        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)

        value = value.astimezone(timezone.utc)

        return int(value.timestamp() * 1000)

    def process_result_value(self, value, dialect):
        if value is None:
            return None

        return datetime.fromtimestamp(
            value / 1000,
            tz=timezone.utc,
        )


class TimestampMixin:
    """Oluşturulma ve güncellenme zamanlarını ortaklaştırır."""

    created_at: Mapped[datetime] = mapped_column(
        "createdAt",
        UTCDateTime(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt",
        UTCDateTime(),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class CuidPrimaryKeyMixin:
    """CUID biçiminde birincil anahtar üretir."""

    id: Mapped[str] = mapped_column(
        String(25),
        primary_key=True,
        default=cuid.cuid,
    )
