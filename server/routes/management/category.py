from fastapi import APIRouter, Depends, status, Path, HTTPException, Query
from ...helpers.schemas import CategoryCreate, CategoryUpdate, CategoryResponse
from ...services import CategoryManagement
from ..utils import get_category_management, RequirePermission, PermissionEnum

router = APIRouter(prefix="/management/categories", tags=["Management"])


@router.get("/", response_model=list[CategoryResponse], status_code=status.HTTP_200_OK)
async def get_categories_endpoint(
    skip: int = Query(default=0),
    limit: int = Query(default=10),
    service: CategoryManagement = Depends(get_category_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        categories = await service.get_multi(skip, limit)
        return [CategoryResponse.model_validate(category) for category in categories]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category_endpoint(
    payload: CategoryCreate,
    service: CategoryManagement = Depends(get_category_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        new_category = await service.create(payload)
        return CategoryResponse.model_validate(new_category)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put(
    "/{id}/", response_model=CategoryResponse, status_code=status.HTTP_202_ACCEPTED
)
async def update_category_endpoint(
    payload: CategoryUpdate,
    id: int = Path(...),
    service: CategoryManagement = Depends(get_category_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        updated_category = await service.update(id, payload)
        return CategoryResponse.model_validate(updated_category)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category_endpoint(
    id: int = Path(...),
    service: CategoryManagement = Depends(get_category_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        await service.delete_hard(id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
