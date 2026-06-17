from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class SavedApplicant(Base):
    __tablename__ = "saved_applicants"
    __table_args__ = (UniqueConstraint("recruiter_id", "applicant_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    recruiter_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    applicant_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    recruiter: Mapped[User] = relationship("User", foreign_keys=[recruiter_id])
    applicant: Mapped[User] = relationship("User", foreign_keys=[applicant_id])
