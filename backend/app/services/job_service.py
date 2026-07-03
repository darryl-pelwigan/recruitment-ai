from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.application import Application
from app.models.job import Job
from app.schemas.job_schema import JobCreate, JobUpdate


def get_jobs(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    employment_types: list[str] | None = None,
    locations: list[str] | None = None,
    statuses: list[str] | None = None,
    posted_by_id: int | None = None,
    posted_within_days: int | None = None,
    applicant_statuses: list[str] | None = None,
):
    query = db.query(Job).filter(Job.deleted_at == None)  # noqa: E711

    if search:
        query = query.filter(
            or_(
                Job.title.ilike(f"%{search}%"),
                Job.description.ilike(f"%{search}%"),
            )
        )

    if employment_types:
        query = query.filter(Job.employment_type.in_(employment_types))

    if locations:
        query = query.filter(or_(*[Job.location.ilike(f"%{loc}%") for loc in locations]))

    if statuses:
        query = query.filter(Job.status.in_(statuses))

    if posted_by_id is not None:
        query = query.filter(Job.posted_by_id == posted_by_id)

    if posted_within_days is not None:
        cutoff = datetime.now(timezone.utc) - timedelta(days=posted_within_days)
        query = query.filter(
            or_(
                Job.posted_at >= cutoff,
                (Job.posted_at == None) & (Job.created_at >= cutoff),  # noqa: E711
            )
        )

    if applicant_statuses:
        has_applicant = (
            db.query(Application.job_id)
            .filter(Application.status.in_(applicant_statuses))
            .subquery()
        )
        query = query.filter(Job.id.in_(has_applicant))

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    jobs = (
        query.order_by(Job.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    counts = dict(
        db.query(Application.job_id, func.count(Application.id))
        .filter(Application.job_id.in_([j.id for j in jobs]))
        .group_by(Application.job_id)
        .all()
    )
    for job in jobs:
        job.applicant_count = counts.get(job.id, 0)

    return {
        "jobs": jobs,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_job_by_id(db: Session, job_id: int) -> Job | None:
    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.deleted_at == None)  # noqa: E711
        .first()
    )
    if job:
        job.applicant_count = (
            db.query(func.count(Application.id))
            .filter(Application.job_id == job_id)
            .scalar()
            or 0
        )
    return job


def create_job(db: Session, data: JobCreate, posted_by_id: int) -> Job:
    now = datetime.now(timezone.utc)
    job = Job(**data.model_dump(), posted_by_id=posted_by_id, posted_at=now)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job(db: Session, job_id: int, data: JobUpdate) -> Job | None:
    job = get_job_by_id(db, job_id)
    if not job:
        return None
    updates = data.model_dump(exclude_unset=True)
    # Refresh posted_at whenever a closed job is reopened
    if updates.get("status") == "open" and job.status != "open":
        updates["posted_at"] = datetime.now(timezone.utc)
    for field, value in updates.items():
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
