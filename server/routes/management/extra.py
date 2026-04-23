from fastapi import APIRouter, Depends, status, Path, HTTPException, Query
from ...helpers.schemas import ExtraCreate, ExtraUpdate, ExtraResponse
from ...services import ExtraManagement
from ..utils import get_extra_management, RequirePermission, PermissionEnum

router = APIRouter(prefix="/management/extras", tags=["Management"])


@router.get("/", response_model=list[ExtraResponse], status_code=status.HTTP_200_OK)
async def get_extras_endpoint(
    skip: int = Query(default=0),
    limit: int = Query(default=10),
    service: ExtraManagement = Depends(get_extra_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        extras = await service.get_multi(skip, limit)
        return [ExtraResponse.model_validate(extra) for extra in extras]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/", response_model=ExtraResponse, status_code=status.HTTP_201_CREATED)
async def create_extra_endpoint(
    payload: ExtraCreate,
    service: ExtraManagement = Depends(get_extra_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        new_extra = await service.create(payload)
        return ExtraResponse.model_validate(new_extra)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put(
    "/{id}/", response_model=ExtraResponse, status_code=status.HTTP_202_ACCEPTED
)
async def update_extra_endpoint(
    payload: ExtraUpdate,
    id: int = Path(...),
    service: ExtraManagement = Depends(get_extra_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        updated_extra = await service.update(id, payload)
        return ExtraResponse.model_validate(updated_extra)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_extra_endpoint(
    id: int = Path(...),
    service: ExtraManagement = Depends(get_extra_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        await service.delete_hard(id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
