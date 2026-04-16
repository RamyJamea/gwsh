from fastapi import APIRouter, Depends, status, Query, HTTPException
from ...models import UserModel
from ...services import UserManagement
from ...helpers.schemas import UserCreate, UserUpdate, UserResponse
from ..dependencies import get_user_management

router = APIRouter(prefix="/management/users", tags=["Management"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    payload: UserCreate,
    service: UserManagement = Depends(get_user_management),
):
    try:
        new_user = await service.create_user(payload)
        return UserResponse.model_validate(new_user)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
