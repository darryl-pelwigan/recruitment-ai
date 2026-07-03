from pydantic import BaseModel


class JobApplicantCount(BaseModel):
    job_id: int
    job_title: str
    count: int


class ConversionRate(BaseModel):
    applied: int
    hired: int
    rate: float


class TopSkill(BaseModel):
    skill: str
    count: int


class DashboardAnalytics(BaseModel):
    active_jobs: int
    total_applicants: int
    conversion_rate: ConversionRate
    applicants_per_job: list[JobApplicantCount]
    top_skills: list[TopSkill]
