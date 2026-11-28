from pydantic import BaseModel, ConfigDict, Field


class CreateProduct(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=30)
    description: str = Field(min_length=1, max_length=100)
    price: float = Field(gt=0, allow_inf_nan=False)
    quantity: int = Field(ge=0)
    category_id: int = Field(gt=0)


class UpdateProduct(CreateProduct):
    pass


class CategoryInProduct(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class TagInProduct(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    quantity: int
    category: CategoryInProduct
    tags: list[TagInProduct] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)
