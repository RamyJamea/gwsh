from fastapi import APIRouter, Depends, status, HTTPException, Query
from ..helpers.schemas.catalog_schema import ExtraCreate, ExtraResponse
from ..helpers.schemas.catalog import ExtraUpdate
from ..services import ExtraManagement
from .utils import get_extra_management, get_current_user, RequirePermission, PermissionEnum
from ..models import UserModel

router = APIRouter(prefix="/extras", tags=["Extras"])


@router.post("/", response_model=ExtraResponse, status_code=status.HTTP_201_CREATED)
async def create_extra(
    data: ExtraCreate,
    service: ExtraManagement = Depends(get_extra_management),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        return await service.create(data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=list[ExtraResponse], status_code=status.HTTP_200_OK)
async def list_extras(
    skip: int = Query(default=0),
    limit: int = Query(default=100),
    current_user: UserModel = Depends(get_current_user),
    service: ExtraManagement = Depends(get_extra_management),
):
    try:
        return await service.get_multi(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{extra_id}", response_model=ExtraResponse, status_code=status.HTTP_200_OK)
async def get_extra(
    extra_id: int,
    current_user: UserModel = Depends(get_current_user),
    service: ExtraManagement = Depends(get_extra_management),
):
    try:
        return await service.get(extra_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{extra_id}", response_model=ExtraResponse, status_code=status.HTTP_200_OK)
async def update_extra(
    extra_id: int,
    data: ExtraUpdate,
    service: ExtraManagement = Depends(get_extra_management),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        return await service.update(extra_id, data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{extra_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_extra(
    extra_id: int,
    service: ExtraManagement = Depends(get_extra_management),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        await service.delete_hard(extra_id)
        return None
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
