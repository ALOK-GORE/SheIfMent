from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud.products import (
    add_tag_to_product as crud_add_tag_to_product,
    create_product as crud_create_product,
    delete_product as crud_delete_product,
    get_all_products as crud_get_all_products,
    get_product as crud_get_product,
    update_product as crud_update_product,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.models.categories_model import Category
from app.models.tags_model import Tag
from app.models.users_model import User
from app.schemas.products import CreateProduct, ProductResponse, UpdateProduct

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: CreateProduct,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.get(Category, product_data.category_id) is None:
        raise HTTPException(status_code=404, detail="Category not found")
    try:
        return crud_create_product(product_data, db)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Product conflicts with a database constraint") from exc


@router.get("", response_model=list[ProductResponse])
def get_all_products(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    category_id: int | None = Query(default=None, gt=0),
    max_price: float | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
):
    return crud_get_all_products(
        db, skip=skip, limit=limit, category_id=category_id, max_price=max_price
    )


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud_get_product(product_id, db)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    update_data: UpdateProduct,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.get(Category, update_data.category_id) is None:
        raise HTTPException(status_code=404, detail="Category not found")
    try:
        product = crud_update_product(product_id, update_data, db)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Product conflicts with a database constraint") from exc
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = crud_delete_product(product_id, db)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{product_id}/tags/{tag_id}", response_model=ProductResponse)
def add_tag_product(
    product_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.get(Tag, tag_id) is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    product = crud_add_tag_to_product(db, product_id, tag_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
