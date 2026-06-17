"""add cover_letter to applications

Revision ID: a2b3c4d5e6f7
Revises: d5e8f3a2c6b1
Create Date: 2026-06-17

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a2b3c4d5e6f7"
down_revision: Union[str, Sequence[str], None] = "d5e8f3a2c6b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("applications", sa.Column("cover_letter", sa.Text, nullable=True))


def downgrade() -> None:
    op.drop_column("applications", "cover_letter")
