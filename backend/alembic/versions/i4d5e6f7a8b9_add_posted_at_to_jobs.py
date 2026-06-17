"""add posted_at to jobs

Revision ID: i4d5e6f7a8b9
Revises: h3c4d5e6f7a8
Create Date: 2026-06-17

"""
from alembic import op
import sqlalchemy as sa

revision = "i4d5e6f7a8b9"
down_revision = "h3c4d5e6f7a8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True))
    # Back-fill existing rows: posted_at = created_at
    op.execute("UPDATE jobs SET posted_at = created_at WHERE posted_at IS NULL")


def downgrade() -> None:
    op.drop_column("jobs", "posted_at")
