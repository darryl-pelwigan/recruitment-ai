from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserUpdate


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


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
        return user
    return None


def update_user_profile(db: Session, user: User, data: UserUpdate) -> tuple[User, str | None]:
    """Returns (updated_user, error_message). error_message is None on success."""
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


def update_user_avatar(db: Session, user: User, avatar_url: str) -> User:
    user.avatar_url = avatar_url
    db.commit()
    db.refresh(user)
    return user
