from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.saved_job import SavedJob
from app.services.job_service import get_job_by_id

router = APIRouter(prefix="/saved-jobs", tags=["Saved Jobs"])


class SavedJobInfo(BaseModel):
    id: int
    title: str
    company_name: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "USD"
    status: str

    model_config = {"from_attributes": True}


class SavedJobResponse(BaseModel):
    id: int
    job: SavedJobInfo
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[SavedJobResponse])
def list_saved_jobs(
    current_user: Annotated[object, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return (
        db.query(SavedJob)
        .filter(SavedJob.user_id == current_user.id)
        .order_by(SavedJob.created_at.desc())
        .all()
    )


@router.post("/{job_id}", status_code=status.HTTP_201_CREATED)
def save_job(
    job_id: int,
    current_user: Annotated[object, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    job = get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    existing = (
        db.query(SavedJob)
        .filter(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already saved")

    saved = SavedJob(user_id=current_user.id, job_id=job_id)
    db.add(saved)
    db.commit()
    return {"message": "Job saved"}


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_job(
    job_id: int,
    current_user: Annotated[object, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    saved = (
        db.query(SavedJob)
        .filter(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id)
        .first()
    )
    if not saved:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved job not found")
    db.delete(saved)
    db.commit()


@router.get("/check/{job_id}")
def check_saved(
    job_id: int,
    current_user: Annotated[object, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    saved = (
        db.query(SavedJob)
        .filter(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id)
        .first()
    )
    return {"saved": saved is not None}
