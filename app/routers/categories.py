from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud.categories import (
    create_category as crud_create_category,
    delete_category as crud_delete_category,
    get_all_category as crud_get_all_category,
    get_category as crud_get_category,
    update_category as crud_update_category,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.models.users_model import User
from app.schemas.categories_schema import CategoryResponse, CreateCategory, UpdateCategory

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CreateCategory,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return crud_create_category(category_data, db)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Category name already exists") from exc


@router.get("", response_model=list[CategoryResponse])
def get_all_category(db: Session = Depends(get_db)):
    return crud_get_all_category(db)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = crud_get_category(category_id, db)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    updated_data: UpdateCategory,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        category = crud_update_category(category_id, updated_data, db)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Category name already exists") from exc
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        category = crud_delete_category(category_id, db)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Cannot delete a category that still has products") from exc
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
