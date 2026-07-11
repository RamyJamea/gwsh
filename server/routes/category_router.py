from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..helpers.schemas.catalog_schema import CategoryCreate, CategoryUpdate, CategoryResponse, ProductResponse
from ..services import CategoryManagement
from .utils import get_category_management, get_current_user, RequirePermission, PermissionEnum
from ..models import UserModel

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=list[CategoryResponse], status_code=status.HTTP_200_OK)
async def list_categories(
    skip: int = Query(default=0),
    limit: int = Query(default=100),
    current_user: UserModel = Depends(get_current_user),
    service: CategoryManagement = Depends(get_category_management),
):
    try:
        return await service.get_multi(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    service: CategoryManagement = Depends(get_category_management),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        return await service.create(data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{category_id}", response_model=CategoryResponse, status_code=status.HTTP_200_OK)
async def get_category(
    category_id: int,
    current_user: UserModel = Depends(get_current_user),
    service: CategoryManagement = Depends(get_category_management),
):
    try:
        return await service.get(category_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{category_id}", response_model=CategoryResponse, status_code=status.HTTP_200_OK)
async def update_category(
    category_id: int,
    data: CategoryUpdate,
    service: CategoryManagement = Depends(get_category_management),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        return await service.update(category_id, data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    service: CategoryManagement = Depends(get_category_management),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        await service.delete_hard(category_id)
        return None
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{category_id}/products", response_model=list[ProductResponse], status_code=status.HTTP_200_OK)
async def get_products_by_category(
    category_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_user),
    service: CategoryManagement = Depends(get_category_management),
):
    try:
        # In CategoryManagement it returns Sequence[ProductResponse]
        return await service.list_category_products(category_id, skip, limit)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
