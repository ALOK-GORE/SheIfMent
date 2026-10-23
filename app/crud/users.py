from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models.users_model import User
from app.schemas.users import UserCreate


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalars(select(User).where(User.email == email)).first()


def get_user_by_name(db: Session, username: str) -> User | None:
    return db.scalars(select(User).where(User.username == username)).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def create_user(db: Session, user_data: UserCreate) -> User:
    user = User(
        username=user_data.username,
        email=str(user_data.email),
        hashed_password=hash_password(user_data.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(user)
    return user
