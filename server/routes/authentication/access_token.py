from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from ...services import Authentication, UserManagement
from ...models import UserModel
from ...helpers.schemas import TokenData, UserResponse, PasswordReset, UserUpdate
from ..utils import get_auth, RequirePermission, PermissionEnum, get_user_management

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenData, status_code=status.HTTP_200_OK)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth: Authentication = Depends(get_auth),
):
    try:
        user_obj = await auth.authenticate_user(form_data.username, form_data.password)
        data = {"sub": user_obj.username, "role": user_obj.role.value}
        expire = datetime.now(timezone.utc) + timedelta(days=1)
        token = await auth.create_access_token(data, expire)
        return TokenData(access_token=token)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.get("/profile", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_profile(
    current_user: UserModel = Depends(
        RequirePermission([PermissionEnum.READ_USERS_ME])
    ),
) -> UserResponse:
    try:
        return current_user
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch(
    "/reset-password", response_model=UserResponse, status_code=status.HTTP_202_ACCEPTED
)
async def reset_password(
    payload: PasswordReset,
    service: UserManagement = Depends(get_user_management),
    current_user: UserModel = Depends(
        RequirePermission([PermissionEnum.RESET_PASSWORD])
    ),
):
    try:
        new_user = await service.update_user(
            current_user.username, UserUpdate(password=payload.new_password)
        )
        return new_user
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
