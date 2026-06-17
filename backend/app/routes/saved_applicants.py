from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.saved_applicant import SavedApplicant
from app.services.auth_service import get_user_by_id

router = APIRouter(prefix="/saved-applicants", tags=["Saved Applicants"])
MANAGE_ROLES = require_roles("admin", "hr", "recruiter")


class SavedApplicantUserInfo(BaseModel):
    id: int
    full_name: str
    email: str
    avatar_url: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    years_of_experience: Optional[int] = None
    skills: Optional[str] = None
    resume_url: Optional[str] = None

    model_config = {"from_attributes": True}


class SavedApplicantResponse(BaseModel):
    id: int
    applicant: SavedApplicantUserInfo
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[SavedApplicantResponse])
def list_saved_applicants(
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
):
    return (
        db.query(SavedApplicant)
        .filter(SavedApplicant.recruiter_id == current_user.id)
        .order_by(SavedApplicant.created_at.desc())
        .all()
    )


@router.post("/{applicant_id}", status_code=status.HTTP_201_CREATED)
def save_applicant(
    applicant_id: int,
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
):
    applicant = get_user_by_id(db, applicant_id)
    if not applicant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = (
        db.query(SavedApplicant)
        .filter(
            SavedApplicant.recruiter_id == current_user.id,
            SavedApplicant.applicant_id == applicant_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already bookmarked")

    saved = SavedApplicant(recruiter_id=current_user.id, applicant_id=applicant_id)
    db.add(saved)
    db.commit()
    return {"message": "Applicant bookmarked"}


@router.delete("/{applicant_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_applicant(
    applicant_id: int,
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
):
    saved = (
        db.query(SavedApplicant)
        .filter(
            SavedApplicant.recruiter_id == current_user.id,
            SavedApplicant.applicant_id == applicant_id,
        )
        .first()
    )
    if not saved:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found")
    db.delete(saved)
    db.commit()


@router.get("/check/{applicant_id}")
def check_saved(
    applicant_id: int,
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
):
    saved = (
        db.query(SavedApplicant)
        .filter(
            SavedApplicant.recruiter_id == current_user.id,
            SavedApplicant.applicant_id == applicant_id,
        )
        .first()
    )
    return {"saved": saved is not None}
