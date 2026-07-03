from collections import Counter

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.job import Job
from app.models.user import User


def get_dashboard_analytics(db: Session, current_user_id: int, role: str) -> dict:
    job_q = db.query(Job).filter(Job.status == "open", Job.deleted_at.is_(None))
    if role in ("recruiter", "hr"):
        job_q = job_q.filter(Job.posted_by_id == current_user_id)
    active_jobs = job_q.count()

    app_q = (
        db.query(Application.job_id, Job.title, func.count(Application.id).label("count"))
        .join(Job, Application.job_id == Job.id)
        .filter(Job.deleted_at.is_(None))
    )
    if role in ("recruiter", "hr"):
        app_q = app_q.filter(Job.posted_by_id == current_user_id)
    rows = (
        app_q.group_by(Application.job_id, Job.title)
        .order_by(func.count(Application.id).desc())
        .all()
    )

    total_applicants = sum(r.count for r in rows)

    hired_q = (
        db.query(func.count(Application.id))
        .join(Job, Application.job_id == Job.id)
        .filter(Application.status == "hired", Job.deleted_at.is_(None))
    )
    if role in ("recruiter", "hr"):
        hired_q = hired_q.filter(Job.posted_by_id == current_user_id)
    total_hired = hired_q.scalar() or 0

    rate = round((total_hired / total_applicants * 100) if total_applicants > 0 else 0.0, 1)

    skills_rows = db.query(User.skills).filter(
        User.skills.isnot(None), User.role == "applicant"
    ).all()
    counter: Counter = Counter()
    for (skills_str,) in skills_rows:
        if skills_str:
            for skill in skills_str.split(","):
                s = skill.strip()
                if s:
                    counter[s] += 1

    return {
        "active_jobs": active_jobs,
        "total_applicants": total_applicants,
        "conversion_rate": {"applied": total_applicants, "hired": total_hired, "rate": rate},
        "applicants_per_job": [
            {"job_id": r.job_id, "job_title": r.title, "count": r.count} for r in rows
        ],
        "top_skills": [{"skill": s, "count": c} for s, c in counter.most_common(10)],
    }
