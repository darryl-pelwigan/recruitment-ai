from datetime import datetime
from typing import Optional

from pydantic import BaseModel

VALID_STATUSES = [
    "applied",
    "under_review",
    "shortlisted",
    "interview_scheduled",
    "rejected",
    "hired",
]


class ApplicantInfo(BaseModel):
    id: int
    full_name: str
    email: str
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class JobBrief(BaseModel):
    id: int
    title: str
    company_name: Optional[str] = None

    model_config = {"from_attributes": True}


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    user_id: int
    resume_url: Optional[str] = None
    cover_letter: Optional[str] = None
    status: str
    ai_score: float
    created_at: datetime
    user: ApplicantInfo
    job: JobBrief

    model_config = {"from_attributes": True}


class ApplicationStatusUpdate(BaseModel):
    status: str


class ApplicationListResponse(BaseModel):
    applications: list[ApplicationResponse]
    total: int
