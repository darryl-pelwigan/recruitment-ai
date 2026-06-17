from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.schemas.user_schema import UserResponse
from app.services.auth_service import get_user_by_id

router = APIRouter(prefix="/users", tags=["Users"])
MANAGE_ROLES = require_roles("admin", "hr", "recruiter")


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
