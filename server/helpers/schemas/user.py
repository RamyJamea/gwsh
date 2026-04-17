from typing import Annotated
from pydantic import BaseModel, Field, EmailStr, SecretStr, AfterValidator
from zxcvbn import zxcvbn
from ..enums import RoleEnum
from .base import AuditSchema


def validate_password_strength(value: SecretStr) -> SecretStr:
    result = zxcvbn(value.get_secret_value())
    if result["score"] < 3:
        warning = result["feedback"]["warning"] or "Password is too weak or common."
        raise ValueError(warning)
    return value


StrongPassword = Annotated[
    SecretStr,
    Field(min_length=8),
    AfterValidator(validate_password_strength),
]


class UserBase(BaseModel):
    email: EmailStr
    role: RoleEnum = RoleEnum.CASHIER
    is_active: bool = True


class UserCreate(UserBase):
    username: str = Field(..., min_length=3, max_length=50)
    branch_id: int | None = None
    password: StrongPassword = Field(..., min_length=8)


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    role: RoleEnum | None = None
    is_active: bool | None = None
    branch_id: int | None = None
    password: StrongPassword | None = Field(None, min_length=8)


class UserResponse(UserBase, AuditSchema):
    username: str = Field(..., min_length=3, max_length=50)
    branch_id: int | None = None


class TokenData(BaseModel):
    access_token: str
    token_type: str = "bearer"
