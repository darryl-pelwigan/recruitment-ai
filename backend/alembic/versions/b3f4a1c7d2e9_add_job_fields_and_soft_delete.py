"""add job fields and soft delete

Revision ID: b3f4a1c7d2e9
Revises: e8f23c5b3c8f
Create Date: 2026-06-10

Adds location, employment_type, salary_min, salary_max, skills_required,
posted_by_id, and deleted_at to the jobs table.
deleted_at is used for soft deletes — NULL means active, non-NULL means deleted.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b3f4a1c7d2e9"
down_revision: Union[str, Sequence[str], None] = "e8f23c5b3c8f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("location", sa.String(255), nullable=True))
    op.add_column("jobs", sa.Column("employment_type", sa.String(50), nullable=True))
    op.add_column("jobs", sa.Column("salary_min", sa.Float(), nullable=True))
    op.add_column("jobs", sa.Column("salary_max", sa.Float(), nullable=True))
    op.add_column("jobs", sa.Column("skills_required", sa.Text(), nullable=True))
    op.add_column("jobs", sa.Column("posted_by_id", sa.Integer(), nullable=True))
    op.add_column(
        "jobs",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_jobs_posted_by_id_users",
        "jobs",
        "users",
        ["posted_by_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_jobs_posted_by_id_users", "jobs", type_="foreignkey")
    op.drop_column("jobs", "deleted_at")
    op.drop_column("jobs", "posted_by_id")
    op.drop_column("jobs", "skills_required")
    op.drop_column("jobs", "salary_max")
    op.drop_column("jobs", "salary_min")
    op.drop_column("jobs", "employment_type")
    op.drop_column("jobs", "location")
