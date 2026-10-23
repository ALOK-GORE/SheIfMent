from sqlalchemy import Column, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    __table_args__ = (UniqueConstraint("name", name="uq_categories_name"),)

    products = relationship("Product", back_populates="category")
