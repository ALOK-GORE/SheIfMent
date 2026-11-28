from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.products_model import Product
from app.models.tags_model import Tag
from app.schemas.products import CreateProduct, UpdateProduct


def create_product(product_data: CreateProduct, db: Session) -> Product:
    product = Product(**product_data.model_dump())
    db.add(product)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(product)
    return product


def get_all_products(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 20,
    category_id: int | None = None,
    max_price: float | None = None,
) -> list[Product]:
    statement = select(Product).options(
        selectinload(Product.category), selectinload(Product.tags)
    )
    if category_id is not None:
        statement = statement.where(Product.category_id == category_id)
    if max_price is not None:
        statement = statement.where(Product.price <= max_price)
    statement = statement.order_by(Product.id).offset(skip).limit(limit)
    return list(db.scalars(statement).all())


def get_product(product_id: int, db: Session) -> Product | None:
    statement = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.tags))
        .where(Product.id == product_id)
    )
    return db.scalars(statement).first()


def update_product(product_id: int, update_data: UpdateProduct, db: Session) -> Product | None:
    product = db.get(Product, product_id)
    if product is None:
        return None

    for field, value in update_data.model_dump().items():
        setattr(product, field, value)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return get_product(product_id, db)


def delete_product(product_id: int, db: Session) -> Product | None:
    product = db.get(Product, product_id)
    if product is None:
        return None
    db.delete(product)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return product


def add_tag_to_product(db: Session, product_id: int, tag_id: int) -> Product | None:
    product = db.get(Product, product_id)
    tag = db.get(Tag, tag_id)
    if product is None or tag is None:
        return None
    if tag not in product.tags:
        product.tags.append(tag)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    return get_product(product_id, db)


def get_available_products(db: Session, price: float = 2000, quantity: int = 0):
    statement = select(Product).where(Product.price > price, Product.quantity > quantity)
    return list(db.scalars(statement).all())


def get_products_by_condition(db: Session, price: float = 1000, quantity: int = 20):
    statement = select(Product).where((Product.price < price) | (Product.quantity > quantity))
    return list(db.scalars(statement).all())


def get_products_sorted_by_price(db: Session):
    return list(db.scalars(select(Product).order_by(Product.price, Product.id)).all())


def get_products_paginated(db: Session, skip: int = 0, limit: int = 10):
    return get_all_products(db, skip=skip, limit=limit)


def get_filtered_products(db: Session, max_price: float = 5000, skip: int = 0, limit: int = 10):
    return get_all_products(db, skip=skip, limit=limit, max_price=max_price)


def get_products_with_categories(db: Session):
    return list(db.scalars(select(Product).options(selectinload(Product.category))).all())


def get_products_with_categories_and_tags(db: Session):
    statement = select(Product).options(selectinload(Product.category), selectinload(Product.tags))
    return list(db.scalars(statement).all())
