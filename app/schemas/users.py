from pydantic import Field ,BaseModel, EmailStr, ConfigDict

class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class UserPublic(BaseModel):
    id: int
    username: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class UserRegistered(UserPublic):
    message: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
