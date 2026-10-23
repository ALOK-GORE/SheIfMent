from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.categories_model import Category
from app.schemas.categories_schema import CreateCategory, UpdateCategory


def create_category(category_data: CreateCategory, db: Session) -> Category:
    category = Category(name=category_data.name)
    db.add(category)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return get_category(category.id, db)


def get_all_category(db: Session) -> list[Category]:
    statement = select(Category).options(selectinload(Category.products)).order_by(Category.id)
    return list(db.scalars(statement).all())


def get_category(category_id: int, db: Session) -> Category | None:
    statement = select(Category).options(selectinload(Category.products)).where(Category.id == category_id)
    return db.scalars(statement).first()


def update_category(category_id: int, updated_data: UpdateCategory, db: Session) -> Category | None:
    category = db.get(Category, category_id)
    if category is None:
        return None
    category.name = updated_data.name
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return get_category(category_id, db)


def delete_category(category_id: int, db: Session) -> Category | None:
    category = db.get(Category, category_id)
    if category is None:
        return None
    db.delete(category)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return category
