from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from jose import jwt
from .user_service import UserService
from ..helpers import get_settings, verify_password

SETTINGS = get_settings()


class AuthenticationService:
    def __init__(self, user_service: UserService):
        self.user_service = user_service

    def authenticate_user(self, username: str, password: str):
        user = self.user_service.get_by_username(username)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
            )
        return user

    def create_access_token(
        self, data: dict, expires_delta: timedelta | None = None
    ) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=1))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SETTINGS.SECRET_KEY, algorithm=SETTINGS.ALGORITHM)

    def login(self, username: str, password: str) -> dict:
        user = self.authenticate_user(username, password)
        token = self.create_access_token(
            data={"sub": user.username, "role": user.role.value}
        )
        return {"access_token": token, "token_type": "bearer"}
