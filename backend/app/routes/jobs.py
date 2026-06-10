from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
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
DELETE_ROLES = require_roles("admin", "hr")


@router.get("/", response_model=JobListResponse)
def list_jobs(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[object, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: Optional[str] = Query(None),
    employment_type: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    return get_jobs(db, page, page_size, search, employment_type, location, status)


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[object, Depends(get_current_user)],
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
    _: Annotated[object, Depends(MANAGE_ROLES)],
):
    job = update_job(db, job_id, data)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    job_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[object, Depends(DELETE_ROLES)],
):
    if not soft_delete_job(db, job_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
