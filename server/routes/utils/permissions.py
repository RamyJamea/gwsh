from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from ...helpers.config import get_settings
from ...helpers.enums import PermissionEnum, ROLE_PERMISSIONS
from ...services import UserManagement
from ...models import UserModel
from .dependencies import get_user_management

SETTINGS = get_settings()
OAUTH2_SCHEMA = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(OAUTH2_SCHEMA),
    service: UserManagement = Depends(get_user_management),
) -> UserModel:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, SETTINGS.HASH_SECRET_KEY, algorithms=[SETTINGS.HASH_ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user_obj = await service.get_user(username)

    if user_obj is None:
        raise credentials_exception

    if not user_obj.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    return user_obj


class RequirePermission:
    def __init__(self, required_permissions: list[PermissionEnum]):
        self.required_permissions = required_permissions

    def __call__(
        self, current_user: UserModel = Depends(get_current_user)
    ) -> UserModel:
        user_permissions = ROLE_PERMISSIONS.get(current_user.role, [])

        for permission in self.required_permissions:
            if permission not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Missing permission: {permission.value}",
                )

        return current_user
