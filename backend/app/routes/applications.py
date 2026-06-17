import os
import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.schemas.application_schema import (
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationStatusUpdate,
    VALID_STATUSES,
)
from app.schemas.pipeline_schema import NoteCreate, NoteResponse, HistoryResponse
from app.services.application_service import (
    add_note,
    already_applied,
    create_application,
    get_applicant_count_for_user,
    get_application_by_id,
    get_applications_for_job,
    get_history,
    get_notes,
    get_recent_applications_for_user,
    get_user_applications,
    update_application_status,
)
from app.services.job_service import get_job_by_id

router = APIRouter(prefix="/applications", tags=["Applications"])
MANAGE_ROLES = require_roles("admin", "hr", "recruiter")
RESUME_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "resumes")


@router.get("/count")
def applicant_count(
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
):
    total = get_applicant_count_for_user(db, current_user.id, current_user.role)
    return {"total": total}


@router.get("/recent", response_model=ApplicationListResponse)
def recent_applications(
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
):
    apps = get_recent_applications_for_user(db, current_user.id, current_user.role)
    return ApplicationListResponse(applications=apps, total=len(apps))


@router.get("/me", response_model=ApplicationListResponse)
def my_applications(
    current_user: Annotated[object, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    apps = get_user_applications(db, current_user.id)
    return ApplicationListResponse(applications=apps, total=len(apps))


@router.get("/job/{job_id}", response_model=ApplicationListResponse)
def job_applications(
    job_id: int,
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
):
    apps = get_applications_for_job(db, job_id)
    return ApplicationListResponse(applications=apps, total=len(apps))


@router.get("/{app_id}/notes", response_model=list[NoteResponse])
def list_notes(
    app_id: int,
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
):
    app = get_application_by_id(db, app_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return get_notes(db, app_id)


@router.post("/{app_id}/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    app_id: int,
    data: NoteCreate,
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
):
    if not data.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Note content cannot be empty")
    app = get_application_by_id(db, app_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return add_note(db, app_id, current_user.id, data.content.strip())


@router.get("/{app_id}/history", response_model=list[HistoryResponse])
def list_history(
    app_id: int,
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
):
    app = get_application_by_id(db, app_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return get_history(db, app_id)


@router.patch("/{app_id}/status", response_model=ApplicationResponse)
def set_status(
    app_id: int,
    data: ApplicationStatusUpdate,
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}",
        )
    app = update_application_status(db, app_id, data.status, current_user.id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app


@router.post("/{job_id}", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply(
    job_id: int,
    current_user: Annotated[object, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    cover_letter: Annotated[Optional[str], Form()] = None,
    resume: Annotated[Optional[UploadFile], File()] = None,
):
    job = get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if job.status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This position is no longer accepting applications",
        )
    if already_applied(db, job_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this job",
        )

    resume_url = None
    if resume and resume.filename:
        if resume.content_type != "application/pdf":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume must be a PDF file",
            )
        content = await resume.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume must be under 5 MB",
            )
        os.makedirs(RESUME_DIR, exist_ok=True)
        filename = f"{uuid.uuid4().hex}.pdf"
        with open(os.path.join(RESUME_DIR, filename), "wb") as f:
            f.write(content)
        resume_url = f"/uploads/resumes/{filename}"

    return create_application(db, job_id, current_user.id, resume_url, cover_letter)
