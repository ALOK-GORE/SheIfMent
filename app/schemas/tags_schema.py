from pydantic import BaseModel, ConfigDict, Field


class CreateTag(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=50)


class UpdateTag(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=50)


class ProductInTag(BaseModel):
    id: int
    name: str
    price: float
    model_config = ConfigDict(from_attributes=True)


class TagResponse(BaseModel):
    id: int
    name: str
    products: list[ProductInTag] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)
