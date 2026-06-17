from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.job import Job


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"))
    resume_url: Mapped[str | None] = mapped_column(String(500))
    cover_letter: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="applied")
    ai_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="applications")
    job: Mapped[Job] = relationship(back_populates="applications")
