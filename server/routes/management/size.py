from fastapi import APIRouter, Depends, status, Path, HTTPException, Query
from ...helpers.schemas import SizeCreate, SizeUpdate, SizeResponse
from ...services import SizeManagement
from ..utils import get_size_management, RequirePermission, PermissionEnum

router = APIRouter(prefix="/management/sizes", tags=["Management"])


@router.get("/", response_model=list[SizeResponse], status_code=status.HTTP_200_OK)
async def get_sizes_endpoint(
    skip: int = Query(default=0),
    limit: int = Query(default=10),
    service: SizeManagement = Depends(get_size_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        sizes = await service.get_multi(skip, limit)
        return [SizeResponse.model_validate(size) for size in sizes]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/", response_model=SizeResponse, status_code=status.HTTP_201_CREATED)
async def create_size_endpoint(
    payload: SizeCreate,
    service: SizeManagement = Depends(get_size_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        new_size = await service.create(payload)
        return SizeResponse.model_validate(new_size)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{id}/", response_model=SizeResponse, status_code=status.HTTP_202_ACCEPTED)
async def update_size_endpoint(
    payload: SizeUpdate,
    id: int = Path(...),
    service: SizeManagement = Depends(get_size_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        updated_size = await service.update(id, payload)
        return SizeResponse.model_validate(updated_size)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_size_endpoint(
    id: int = Path(...),
    service: SizeManagement = Depends(get_size_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        await service.delete_hard(id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
