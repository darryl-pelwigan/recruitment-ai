from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.application import Application
from app.models.application_note import ApplicationNote
from app.models.application_history import ApplicationHistory
from app.models.job import Job


def _load(db: Session, app_id: int) -> Application | None:
    return (
        db.query(Application)
        .options(joinedload(Application.user), joinedload(Application.job))
        .filter(Application.id == app_id)
        .first()
    )


def already_applied(db: Session, job_id: int, user_id: int) -> bool:
    return (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.user_id == user_id)
        .first()
    ) is not None


def create_application(
    db: Session,
    job_id: int,
    user_id: int,
    resume_url: str | None,
    cover_letter: str | None,
) -> Application:
    app = Application(
        job_id=job_id,
        user_id=user_id,
        resume_url=resume_url,
        cover_letter=cover_letter,
        status="applied",
        ai_score=0.0,
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # Auto-score the application against the job description
    try:
        from app.services.ai_service import score_application as _score
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            app.ai_score = _score(
                resume_url=resume_url,
                cover_letter=cover_letter,
                skills_required=job.skills_required,
                description=job.description,
                requirements=job.requirements,
            )
            db.commit()
    except Exception:
        pass  # scoring failure is non-fatal

    return _load(db, app.id)


def get_applications_for_job(db: Session, job_id: int) -> list[Application]:
    return (
        db.query(Application)
        .options(joinedload(Application.user), joinedload(Application.job))
        .filter(Application.job_id == job_id)
        .order_by(Application.ai_score.desc(), Application.created_at.desc())
        .all()
    )


def rescore_application(db: Session, application: Application) -> Application:
    """Re-run AI scoring for an existing application and persist the result."""
    try:
        from app.services.ai_service import score_application as _score
        job = application.job
        application.ai_score = _score(
            resume_url=application.resume_url,
            cover_letter=application.cover_letter,
            skills_required=job.skills_required if job else None,
            description=job.description if job else None,
            requirements=job.requirements if job else None,
        )
        db.commit()
    except Exception:
        pass
    return _load(db, application.id)


def get_user_applications(db: Session, user_id: int) -> list[Application]:
    return (
        db.query(Application)
        .options(joinedload(Application.user), joinedload(Application.job))
        .filter(Application.user_id == user_id)
        .order_by(Application.created_at.desc())
        .all()
    )


def get_application_by_id(db: Session, app_id: int) -> Application | None:
    return _load(db, app_id)


def get_recent_applications_for_user(
    db: Session, user_id: int, role: str, limit: int = 20
) -> list[Application]:
    query = (
        db.query(Application)
        .options(joinedload(Application.user), joinedload(Application.job))
        .join(Job, Application.job_id == Job.id)
    )
    if role in ("recruiter", "hr"):
        query = query.filter(Job.posted_by_id == user_id)
    return query.order_by(Application.created_at.desc()).limit(limit).all()


def get_applicant_count_for_user(db: Session, user_id: int, role: str) -> int:
    query = db.query(func.count(Application.id)).join(Job, Application.job_id == Job.id)
    if role in ("recruiter", "hr"):
        query = query.filter(Job.posted_by_id == user_id)
    return query.scalar() or 0


def update_application_status(
    db: Session, app_id: int, new_status: str, changed_by_id: int
) -> Application | None:
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        return None
    old_status = app.status
    app.status = new_status
    history = ApplicationHistory(
        application_id=app_id,
        from_status=old_status,
        to_status=new_status,
        changed_by_id=changed_by_id,
    )
    db.add(history)
    db.commit()
    return _load(db, app_id)


def get_notes(db: Session, application_id: int) -> list[ApplicationNote]:
    return (
        db.query(ApplicationNote)
        .options(joinedload(ApplicationNote.author))
        .filter(ApplicationNote.application_id == application_id)
        .order_by(ApplicationNote.created_at.asc())
        .all()
    )


def add_note(
    db: Session, application_id: int, author_id: int, content: str
) -> ApplicationNote:
    note = ApplicationNote(
        application_id=application_id,
        author_id=author_id,
        content=content,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return (
        db.query(ApplicationNote)
        .options(joinedload(ApplicationNote.author))
        .filter(ApplicationNote.id == note.id)
        .first()
    )


def get_history(db: Session, application_id: int) -> list[ApplicationHistory]:
    return (
        db.query(ApplicationHistory)
        .options(joinedload(ApplicationHistory.changed_by))
        .filter(ApplicationHistory.application_id == application_id)
        .order_by(ApplicationHistory.changed_at.asc())
        .all()
    )
