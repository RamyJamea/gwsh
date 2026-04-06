from pydantic import BaseModel, Field
from ..enums import RoleEnum
from .base_schema import AuditSchema


class UserBase(BaseModel):
    username: str
    role: RoleEnum = RoleEnum.CASHIER
    is_active: bool = True


class UserCreate(UserBase):
    branch_id: int
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    username: str | None = None
    role: RoleEnum | None = None
    is_active: bool | None = None
    password: str | None = Field(None, min_length=8)


class UserResponse(UserBase, AuditSchema):
    branch_id: int


class TokenData(BaseModel):
    access_token: str
    token_type: str


class PasswordReset(BaseModel):
    new_password: str = Field(..., min_length=8)
