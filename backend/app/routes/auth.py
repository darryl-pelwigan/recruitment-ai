import os
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user
from app.schemas.user_schema import Token, UserCreate, UserLogin, UserResponse, UserUpdate
from app.services.auth_service import (
    authenticate_user,
    create_user,
    get_user_by_email,
    update_user_profile,
    update_user_avatar,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
AVATAR_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "avatars")


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(data: UserCreate, db: Annotated[Session, Depends(get_db)]):
    if get_user_by_email(db, data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    return create_user(db, data)


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Annotated[Session, Depends(get_db)]):
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return Token(
        access_token=create_access_token({"sub": user.email}),
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: Annotated[object, Depends(get_current_user)]):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: UserUpdate,
    current_user: Annotated[object, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    updated, error = update_user_profile(db, current_user, data)
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    return updated


@router.post("/avatar", response_model=UserResponse)
async def upload_avatar(
    file: Annotated[UploadFile, File()],
    current_user: Annotated[object, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WebP, or GIF images are allowed",
        )

    os.makedirs(AVATAR_DIR, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(AVATAR_DIR, filename)

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be under 5 MB",
        )

    with open(filepath, "wb") as f:
        f.write(content)

    # Remove old avatar file if it exists
    if current_user.avatar_url:
        old_filename = current_user.avatar_url.split("/")[-1]
        old_path = os.path.join(AVATAR_DIR, old_filename)
        if os.path.exists(old_path):
            os.remove(old_path)

    avatar_url = f"/uploads/avatars/{filename}"
    return update_user_avatar(db, current_user, avatar_url)
