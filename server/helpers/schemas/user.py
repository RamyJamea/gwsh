from pydantic import BaseModel, Field, EmailStr, SecretStr
from ..enums import RoleEnum
from .base import AuditSchema


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    role: RoleEnum = RoleEnum.CASHIER
    is_active: bool = True


class UserCreate(UserBase):
    branch_id: int
    password: SecretStr = Field(..., min_length=8)


class UserUpdate(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=50)
    email: EmailStr | None = None
    role: RoleEnum | None = None
    is_active: bool | None = None
    branch_id: int | None = None
    password: str | None = Field(None, min_length=8)


class UserResponse(UserBase, AuditSchema):
    branch_id: int


class TokenData(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PasswordReset(BaseModel):
    new_password: str = Field(..., min_length=8)
