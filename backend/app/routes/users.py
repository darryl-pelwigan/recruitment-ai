from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.schemas.user_schema import UserResponse
from app.services.auth_service import get_user_by_id

router = APIRouter(prefix="/users", tags=["Users"])
MANAGE_ROLES = require_roles("admin", "hr", "recruiter")


@router.get("/", response_model=list[UserResponse])
def list_applicants(
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
    search: Optional[str] = Query(None),
):
    query = db.query(User).filter(User.role == "applicant")
    if search:
        term = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(term)) | (User.email.ilike(term))
        )
    return query.order_by(User.full_name.asc()).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user_profile(
    user_id: int,
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
