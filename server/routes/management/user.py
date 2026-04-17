from fastapi import APIRouter, Depends, status, Path, HTTPException, Query
from ...helpers.schemas import UserCreate, UserUpdate, UserResponse
from ...services import UserManagement
from ..utils import get_user_management, RequirePermission, PermissionEnum

router = APIRouter(prefix="/management/users", tags=["Management"])


@router.get("/", response_model=list[UserResponse], status_code=status.HTTP_200_OK)
async def get_users_endpoint(
    skip: int = Query(default=0),
    limit: int = Query(default=10),
    service: UserManagement = Depends(get_user_management),
    _=RequirePermission([PermissionEnum.READ_USERS]),
):
    try:
        users = await service.get_users(skip, limit, False)
        return [UserResponse.model_validate(user) for user in users]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/deleted/", response_model=list[UserResponse], status_code=status.HTTP_200_OK
)
async def get_deleted_users_endpoint(
    skip: int = Query(default=0),
    limit: int = Query(default=10),
    service: UserManagement = Depends(get_user_management),
    _=RequirePermission([PermissionEnum.DELETE_USERS]),
):
    try:
        exists_users = await service.get_users(skip, limit, False)
        all_users = await service.get_users(skip, limit, True)
        deleted_users = [user for user in all_users if user not in exists_users]
        return [UserResponse.model_validate(user) for user in deleted_users]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    payload: UserCreate,
    service: UserManagement = Depends(get_user_management),
    _=RequirePermission([PermissionEnum.CREATE_USERS]),
):
    try:
        new_user = await service.create_user(payload)
        return UserResponse.model_validate(new_user)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{username}/", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_user_endpoint(
    username: str = Path(...),
    service: UserManagement = Depends(get_user_management),
    _=RequirePermission([PermissionEnum.READ_USERS]),
):
    try:
        user = await service.get_user(username)
        return UserResponse.model_validate(user)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put(
    "/{username}/", response_model=UserResponse, status_code=status.HTTP_202_ACCEPTED
)
async def update_user_endpoint(
    payload: UserUpdate,
    username: str = Path(...),
    service: UserManagement = Depends(get_user_management),
    _=RequirePermission([PermissionEnum.UPDATE_USERS]),
):
    try:
        updated_user = await service.update_user(username, payload)
        return UserResponse.model_validate(updated_user)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{username}/hard/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hard_user_endpoint(
    username: str = Path(...),
    service: UserManagement = Depends(get_user_management),
    _=RequirePermission([PermissionEnum.DELETE_USERS]),
):
    try:
        await service.delete_hard_user(username)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{username}/soft/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_soft_user_endpoint(
    username: str = Path(...),
    service: UserManagement = Depends(get_user_management),
    _=RequirePermission([PermissionEnum.DELETE_USERS]),
):
    try:
        await service.delete_soft_user(username)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{username}/revive/",
    response_model=UserResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def revive_user_endpoint(
    username: str = Path(...),
    service: UserManagement = Depends(get_user_management),
):
    try:
        user_obj = await service.revive_user(username)
        return UserResponse.model_validate(user_obj)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
