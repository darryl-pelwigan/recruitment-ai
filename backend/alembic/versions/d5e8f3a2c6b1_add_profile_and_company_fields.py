"""add profile and company fields

Revision ID: d5e8f3a2c6b1
Revises: c4e7f2a9b1d3
Create Date: 2026-06-17

Adds avatar_url to users.
Adds company_name, company_logo_url, contact_email, salary_currency to jobs.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d5e8f3a2c6b1"
down_revision: Union[str, Sequence[str], None] = "c4e7f2a9b1d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.String(500), nullable=True))

    op.add_column("jobs", sa.Column("company_name", sa.String(255), nullable=True))
    op.add_column("jobs", sa.Column("company_logo_url", sa.String(500), nullable=True))
    op.add_column("jobs", sa.Column("contact_email", sa.String(255), nullable=True))
    op.add_column(
        "jobs",
        sa.Column("salary_currency", sa.String(10), nullable=False, server_default="USD"),
    )


def downgrade() -> None:
    op.drop_column("jobs", "salary_currency")
    op.drop_column("jobs", "contact_email")
    op.drop_column("jobs", "company_logo_url")
    op.drop_column("jobs", "company_name")
    op.drop_column("users", "avatar_url")
