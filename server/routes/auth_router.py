from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from ..models import User
from ..core.schemas import UserResponse, PasswordReset
from ..core.dependencies import get_current_user, get_auth_service, get_user_service
from ..services import AuthenticationService, UserService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthenticationService = Depends(get_auth_service),
):
    return auth_service.login(form_data.username, form_data.password)


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/reset-password", response_model=UserResponse)
def reset_password(
    payload: PasswordReset,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    return user_service.reset_password(current_user.id, payload.new_password)
