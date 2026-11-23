"""Baseline for the existing Prisma database."""

from typing import Sequence, Union

from alembic import op


revision: str = "f6dd81e90659"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Mark the existing database schema as the baseline."""
    pass


def downgrade() -> None:
    """No schema changes are performed by the baseline."""
    pass
