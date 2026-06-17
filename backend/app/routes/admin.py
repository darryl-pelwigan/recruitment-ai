from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.schemas.user_schema import AdminPasswordChange, AdminRoleChange, UserResponse
from app.services.auth_service import (
    admin_change_password,
    admin_change_role,
    get_all_users,
    get_user_by_id,
)

router = APIRouter(prefix="/admin", tags=["Admin"])
ADMIN_ONLY = require_roles("admin")

ALLOWED_ROLES = {"applicant", "recruiter", "hr", "admin"}


@router.get("/users", response_model=list[UserResponse])
def list_users(
    current_user: Annotated[object, Depends(ADMIN_ONLY)],
    db: Annotated[Session, Depends(get_db)],
):
    return get_all_users(db)


@router.patch("/users/{user_id}/password", response_model=UserResponse)
def change_user_password(
    user_id: int,
    data: AdminPasswordChange,
    current_user: Annotated[object, Depends(ADMIN_ONLY)],
    db: Annotated[Session, Depends(get_db)],
):
    if not data.new_password or len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return admin_change_password(db, user, data)


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def change_user_role(
    user_id: int,
    data: AdminRoleChange,
    current_user: Annotated[object, Depends(ADMIN_ONLY)],
    db: Annotated[Session, Depends(get_db)],
):
    if data.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(sorted(ALLOWED_ROLES))}",
        )
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return admin_change_role(db, user, data.role)
