from pathlib import Path
from collections.abc import Generator

from sqlalchemy import create_engine, URL, event
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import get_settings


settings = get_settings()

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent

DATABASE_PATH = PROJECT_ROOT / "prisma" / "dev.db"

if settings.database_url:
    database_url = settings.database_url
else:
    database_url = URL.create(
        drivername="sqlite",
        database=str(DATABASE_PATH),
    )

connect_args = (
    {"check_same_thread": False}
    if database_url.drivername.startswith("sqlite")
    else {}
)

engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)
if engine.dialect.name == "sqlite":

    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()

        cursor.execute("PRAGMA foreign_keys=ON")

        cursor.close()

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """Provides a separate database session for each API request."""

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
