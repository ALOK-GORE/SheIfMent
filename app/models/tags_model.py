from sqlalchemy import Column, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    __table_args__ = (UniqueConstraint("name", name="uq_tags_name"),)

    products = relationship("Product", secondary="product_tags", back_populates="tags")
