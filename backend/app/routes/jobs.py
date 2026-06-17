import os
import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.schemas.job_schema import JobCreate, JobListResponse, JobResponse, JobUpdate
from app.services.job_service import (
    create_job,
    get_job_by_id,
    get_jobs,
    soft_delete_job,
    update_job,
)

router = APIRouter(prefix="/jobs", tags=["Jobs"])

MANAGE_ROLES = require_roles("admin", "hr", "recruiter")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/svg+xml"}
LOGO_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "logos")


def _check_job_ownership(job, current_user):
    if current_user.role in ("recruiter", "hr") and job.posted_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own job postings",
        )


@router.get("/", response_model=JobListResponse)
def list_jobs(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: Optional[str] = Query(None),
    employment_type: list[str] = Query(default=[]),
    location: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    posted_by_id: Optional[int] = Query(None),
):
    return get_jobs(db, page, page_size, search, employment_type or None, location, status, posted_by_id)


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    job = get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create(
    data: JobCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
):
    return create_job(db, data, current_user.id)


@router.put("/{job_id}", response_model=JobResponse)
def update(
    job_id: int,
    data: JobUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
):
    job = get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    _check_job_ownership(job, current_user)
    return update_job(db, job_id, data)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    job_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
):
    job = get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    _check_job_ownership(job, current_user)
    soft_delete_job(db, job_id)


@router.post("/logo", response_model=dict)
async def upload_logo(
    file: Annotated[UploadFile, File()],
    _: Annotated[object, Depends(MANAGE_ROLES)],
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WebP, or SVG images are allowed",
        )

    os.makedirs(LOGO_DIR, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "png"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(LOGO_DIR, filename)

    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logo must be under 2 MB",
        )

    with open(filepath, "wb") as f:
        f.write(content)

    return {"logo_url": f"/uploads/logos/{filename}"}
