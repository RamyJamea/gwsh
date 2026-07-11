from fastapi import APIRouter, Depends, status, HTTPException, Query
from ..helpers.schemas.catalog_schema import SizeCreate, SizeResponse
from ..helpers.schemas.catalog import SizeUpdate
from ..services import SizeManagement
from .utils import get_size_management, get_current_user, RequirePermission, PermissionEnum
from ..models import UserModel

router = APIRouter(prefix="/sizes", tags=["Sizes"])


@router.post("/", response_model=SizeResponse, status_code=status.HTTP_201_CREATED)
async def create_size(
    data: SizeCreate,
    service: SizeManagement = Depends(get_size_management),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        return await service.create(data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=list[SizeResponse], status_code=status.HTTP_200_OK)
async def list_sizes(
    skip: int = Query(default=0),
    limit: int = Query(default=100),
    current_user: UserModel = Depends(get_current_user),
    service: SizeManagement = Depends(get_size_management),
):
    try:
        return await service.get_multi(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{size_id}", response_model=SizeResponse, status_code=status.HTTP_200_OK)
async def get_size(
    size_id: int,
    current_user: UserModel = Depends(get_current_user),
    service: SizeManagement = Depends(get_size_management),
):
    try:
        return await service.get(size_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{size_id}", response_model=SizeResponse, status_code=status.HTTP_200_OK)
async def update_size(
    size_id: int,
    data: SizeUpdate,
    service: SizeManagement = Depends(get_size_management),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        return await service.update(size_id, data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{size_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_size(
    size_id: int,
    service: SizeManagement = Depends(get_size_management),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        await service.delete_hard(size_id)
        return None
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
