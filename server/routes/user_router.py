from fastapi import APIRouter, Depends, status, Query, HTTPException
from ..models import User
from ..core.schemas.user_schema import UserCreate, UserUpdate, UserResponse
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


@router.get("/", response_model=list[UserResponse])
def get_users(
    branch_id: int | None = Query(None),
    current_admin: User = Depends(get_current_admin),
    user_service: UserService = Depends(get_user_service),
):
    if branch_id is not None:
        return user_service.repo.get_active_users_by_branch(branch_id)
    return user_service.get_all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    user_service: UserService = Depends(get_user_service),
):
    user = user_service.get(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    current_admin: User = Depends(get_current_admin),
    user_service: UserService = Depends(get_user_service),
):
    if user_service.get(user_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    updated_user = user_service.update(user_id, user_in)
    return updated_user
