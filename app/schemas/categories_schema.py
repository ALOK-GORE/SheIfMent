from pydantic import BaseModel, ConfigDict, Field


class CreateCategory(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=30)


class UpdateCategory(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=30)


class ProductInCategory(BaseModel):
    id: int
    name: str
    price: float
    model_config = ConfigDict(from_attributes=True)


class CategoryResponse(BaseModel):
    id: int
    name: str
    products: list[ProductInCategory] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)
