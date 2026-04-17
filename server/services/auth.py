from datetime import datetime
from jose import jwt
from ..helpers.config import get_settings
from ..helpers.security import verify_password
from ..helpers.exceptions import UnAuthorizedException, InActiveException
from ..models import UserModel
from .user import UserManagement

SETTINGS = get_settings()


class Authentication:
    def __init__(self, user_management: UserManagement):
        self.user_management = user_management

    async def authenticate_user(self, username: str, password: str) -> UserModel:
        user_obj: UserModel = await self.user_management.get_user(username)

        if not user_obj or not verify_password(password, user_obj.hashed_password):
            raise UnAuthorizedException(f"Unauthorized user: {user_obj.username}")
        if not user_obj.is_active:
            raise InActiveException(f"Inactive user: {user_obj.username}")

        return user_obj

    async def create_access_token(self, data: dict, expire: datetime) -> str:
        to_encode = data.copy()
        to_encode.update({"exp": expire})
        return jwt.encode(
            to_encode, SETTINGS.HASH_SECRET_KEY, algorithm=SETTINGS.HASH_ALGORITHM
        )
