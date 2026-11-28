from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.tags_model import Tag
from app.schemas.tags_schema import CreateTag, UpdateTag


def create_tag(tag_data: CreateTag, db: Session) -> Tag:
    tag = Tag(name=tag_data.name)
    db.add(tag)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return get_tag(tag.id, db)


def get_all_tags(db: Session) -> list[Tag]:
    statement = select(Tag).options(selectinload(Tag.products)).order_by(Tag.id)
    return list(db.scalars(statement).all())


def get_tag(tag_id: int, db: Session) -> Tag | None:
    statement = select(Tag).options(selectinload(Tag.products)).where(Tag.id == tag_id)
    return db.scalars(statement).first()


def update_tag(tag_id: int, updated_data: UpdateTag, db: Session) -> Tag | None:
    tag = db.get(Tag, tag_id)
    if tag is None:
        return None
    tag.name = updated_data.name
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return get_tag(tag_id, db)
