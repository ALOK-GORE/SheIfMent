from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import create_access_token, verify_password
from app.crud.users import (
    create_user as crud_create_user,
    get_user_by_email as crud_get_user_by_email,
    get_user_by_name as crud_get_user_by_name,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.models.users_model import User
from app.schemas.users import TokenResponse, UserCreate, UserLogin, UserPublic, UserRegistered

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserRegistered)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    if crud_get_user_by_email(db, str(user_data.email)):
        raise HTTPException(status_code=409, detail="Email is already registered")
    if crud_get_user_by_name(db, user_data.username):
        raise HTTPException(status_code=409, detail="Username is already taken")
    try:
        user = crud_create_user(db, user_data)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or username is already registered") from exc
    return UserRegistered(
        id=user.id,
        username=user.username,
        email=user.email,
        message="User registered successfully",
    )


@router.post("/login", response_model=TokenResponse)
def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    user = crud_get_user_by_email(db, str(user_data.email))
    if user is None or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
    return TokenResponse(access_token=create_access_token(user.id), token_type="bearer")


@router.get("/me", response_model=UserPublic)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
