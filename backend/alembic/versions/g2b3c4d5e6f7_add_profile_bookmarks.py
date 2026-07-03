"""add extended profile fields, saved_applicants, and saved_jobs

Revision ID: g2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-06-17

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "g2b3c4d5e6f7"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Extended profile columns on users table
    op.add_column("users", sa.Column("phone", sa.String(50), nullable=True))
    op.add_column("users", sa.Column("location", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("headline", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("summary", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("expected_salary", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("salary_currency", sa.String(10), nullable=True, server_default="PHP"))
    op.add_column("users", sa.Column("skills", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("resume_url", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("linkedin_url", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("portfolio_url", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("years_of_experience", sa.Integer(), nullable=True))

    # saved_applicants table
    op.create_table(
        "saved_applicants",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("recruiter_id", sa.Integer(), nullable=False),
        sa.Column("applicant_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["recruiter_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["applicant_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("recruiter_id", "applicant_id"),
    )
    op.create_index(op.f("ix_saved_applicants_id"), "saved_applicants", ["id"], unique=False)

    # saved_jobs table
    op.create_table(
        "saved_jobs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("job_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "job_id"),
    )
    op.create_index(op.f("ix_saved_jobs_id"), "saved_jobs", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_saved_jobs_id"), table_name="saved_jobs")
    op.drop_table("saved_jobs")
    op.drop_index(op.f("ix_saved_applicants_id"), table_name="saved_applicants")
    op.drop_table("saved_applicants")
    for col in ["years_of_experience", "portfolio_url", "linkedin_url", "resume_url",
                "skills", "salary_currency", "expected_salary", "summary",
                "headline", "location", "phone"]:
        op.drop_column("users", col)
