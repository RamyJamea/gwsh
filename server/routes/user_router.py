from fastapi import APIRouter, Depends, status
from ..models import User
from ..core.schemas.user_schema import UserCreate, UserResponse
from ..core.dependencies import get_current_admin, get_user_service
from ..services import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    user_in: UserCreate,
    current_admin: User = Depends(get_current_admin),
    user_service: UserService = Depends(get_user_service),
):
    return user_service.create(user_in)
