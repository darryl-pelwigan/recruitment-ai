from sqlalchemy.orm import Session, joinedload

from app.models.application import Application


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
    return _load(db, app.id)


def get_applications_for_job(db: Session, job_id: int) -> list[Application]:
    return (
        db.query(Application)
        .options(joinedload(Application.user), joinedload(Application.job))
        .filter(Application.job_id == job_id)
        .order_by(Application.created_at.desc())
        .all()
    )


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


def update_application_status(db: Session, app_id: int, new_status: str) -> Application | None:
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        return None
    app.status = new_status
    db.commit()
    return _load(db, app_id)
