from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class JobCreate(BaseModel):
    title: str
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills_required: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "USD"
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    contact_email: Optional[str] = None
    status: str = "open"


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills_required: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    contact_email: Optional[str] = None
    status: Optional[str] = None


class JobResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    requirements: Optional[str]
    skills_required: Optional[str]
    location: Optional[str]
    employment_type: Optional[str]
    salary_min: Optional[float]
    salary_max: Optional[float]
    salary_currency: str
    company_name: Optional[str]
    company_logo_url: Optional[str]
    contact_email: Optional[str]
    status: str
    posted_by_id: Optional[int]
    created_at: datetime
    applicant_count: int = 0

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
