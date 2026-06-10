from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.job import Job
from app.schemas.job_schema import JobCreate, JobUpdate


def get_jobs(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    employment_type: str | None = None,
    location: str | None = None,
    status: str | None = None,
):
    query = db.query(Job).filter(Job.deleted_at == None)  # noqa: E711

    if search:
        query = query.filter(
            or_(
                Job.title.ilike(f"%{search}%"),
                Job.description.ilike(f"%{search}%"),
            )
        )

    if employment_type:
        query = query.filter(Job.employment_type == employment_type)

    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))

    if status:
        query = query.filter(Job.status == status)

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    jobs = (
        query.order_by(Job.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "jobs": jobs,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_job_by_id(db: Session, job_id: int) -> Job | None:
    return (
        db.query(Job)
        .filter(Job.id == job_id, Job.deleted_at == None)  # noqa: E711
        .first()
    )


def create_job(db: Session, data: JobCreate, posted_by_id: int) -> Job:
    job = Job(**data.model_dump(), posted_by_id=posted_by_id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job(db: Session, job_id: int, data: JobUpdate) -> Job | None:
    job = get_job_by_id(db, job_id)
    if not job:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return job


def soft_delete_job(db: Session, job_id: int) -> bool:
    job = get_job_by_id(db, job_id)
    if not job:
        return False
    job.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return True
