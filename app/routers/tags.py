from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud.tags import (
    create_tag as crud_create_tag,
    get_all_tags as crud_get_all_tags,
    get_tag as crud_get_tag,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.models.users_model import User
from app.schemas.tags_schema import CreateTag, TagResponse

router = APIRouter(prefix="/tags", tags=["Tags"])


@router.get("", response_model=list[TagResponse])
def get_all_tags(db: Session = Depends(get_db)):
    return crud_get_all_tags(db)


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag_data: CreateTag,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return crud_create_tag(tag_data, db)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Tag name already exists") from exc


@router.get("/{tag_id}", response_model=TagResponse)
def get_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = crud_get_tag(tag_id, db)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag
