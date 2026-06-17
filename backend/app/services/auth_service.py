from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user_schema import AdminPasswordChange, ExtendedProfileUpdate, UserCreate, UserUpdate


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_all_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


def create_user(db: Session, data: UserCreate) -> User:
    user = User(
        full_name=data.full_name,
        email=data.email,
        password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user and verify_password(password, user.password):
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
        return user
    return None


def update_user_profile(db: Session, user: User, data: UserUpdate) -> tuple[User, str | None]:
    if data.new_password:
        if not data.current_password:
            return user, "Current password is required to set a new password"
        if not verify_password(data.current_password, user.password):
            return user, "Current password is incorrect"
        user.password = hash_password(data.new_password)

    if data.full_name is not None:
        user.full_name = data.full_name

    if data.email is not None and data.email != user.email:
        if get_user_by_email(db, data.email):
            return user, "Email already in use"
        user.email = data.email

    db.commit()
    db.refresh(user)
    return user, None


def update_extended_profile(db: Session, user: User, data: ExtendedProfileUpdate) -> User:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def update_user_avatar(db: Session, user: User, avatar_url: str) -> User:
    user.avatar_url = avatar_url
    db.commit()
    db.refresh(user)
    return user


def update_user_resume(db: Session, user: User, resume_url: str) -> User:
    user.resume_url = resume_url
    db.commit()
    db.refresh(user)
    return user


def admin_change_password(db: Session, user: User, data: AdminPasswordChange) -> User:
    user.password = hash_password(data.new_password)
    db.commit()
    db.refresh(user)
    return user


def admin_change_role(db: Session, user: User, role: str) -> User:
    user.role = role
    db.commit()
    db.refresh(user)
    return user
