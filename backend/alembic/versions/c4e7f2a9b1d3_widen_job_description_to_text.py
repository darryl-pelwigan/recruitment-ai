"""widen job description to text

Revision ID: c4e7f2a9b1d3
Revises: b3f4a1c7d2e9
Create Date: 2026-06-10

Changes jobs.description from VARCHAR(1000) to TEXT to support
rich HTML content from the WYSIWYG editor.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c4e7f2a9b1d3"
down_revision: Union[str, Sequence[str], None] = "b3f4a1c7d2e9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "jobs",
        "description",
        existing_type=sa.String(1000),
        type_=sa.Text(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "jobs",
        "description",
        existing_type=sa.Text(),
        type_=sa.String(1000),
        existing_nullable=True,
    )
