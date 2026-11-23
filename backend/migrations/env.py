from logging.config import fileConfig

from alembic import context
from sqlalchemy import DateTime, String

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.models.base import UTCDateTime
import app.models


config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


target_metadata = Base.metadata

settings = get_settings()


def compare_type(
    context,
    inspected_column,
    metadata_column,
    inspected_type,
    metadata_type,
):
    """Mevcut Prisma SQLite tür farklarını güvenli şekilde ele alır."""

    if context.dialect.name != "sqlite":
        return None


    if isinstance(inspected_type, String) and isinstance(metadata_type, String):
        return False


    if (
        isinstance(inspected_type, DateTime)
        and isinstance(metadata_type, UTCDateTime)
        and metadata_column.name in {
            "createdAt",
            "updatedAt",
            "loginAt",
        }
    ):
        return False

    return None


def include_object(object, name, type_, reflected, compare_to):
    """Mevcut e-posta unique indeksinin gereksiz değişmesini önler."""

    if (
        type_ == "index"
        and reflected
        and name == "User_email_key"
        and object.table.name == "User"
    ):
        return False

    if (
        type_ == "unique_constraint"
        and not reflected
        and object.table.name == "User"
        and {column.name for column in object.columns} == {"email"}
    ):
        return False

    return True


def run_migrations_offline() -> None:
    """Migration işlemlerini veritabanına bağlanmadan hazırlar."""

    url = settings.database_url or str(engine.url)

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=compare_type,
        include_object=include_object,
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Migration işlemlerini veritabanı bağlantısıyla yürütür."""

    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=compare_type,
            include_object=include_object,
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()


