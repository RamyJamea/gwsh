from fastapi import APIRouter, Depends, status, HTTPException, Query
from ..helpers.schemas.catalog_schema import ProductCreate, ProductUpdate, ProductResponse
from ..services import ProductManagement
from .utils import get_product_management, get_current_user, RequirePermission, PermissionEnum
from ..models import UserModel

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    service: ProductManagement = Depends(get_product_management),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        return await service.create(data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=list[ProductResponse], status_code=status.HTTP_200_OK)
async def list_products(
    skip: int = Query(default=0),
    limit: int = Query(default=100),
    current_user: UserModel = Depends(get_current_user),
    service: ProductManagement = Depends(get_product_management),
):
    try:
        return await service.get_multi(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{product_id}", response_model=ProductResponse, status_code=status.HTTP_200_OK)
async def get_product(
    product_id: int,
    current_user: UserModel = Depends(get_current_user),
    service: ProductManagement = Depends(get_product_management),
):
    try:
        return await service.get(product_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{product_id}", response_model=ProductResponse, status_code=status.HTTP_200_OK)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    service: ProductManagement = Depends(get_product_management),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        return await service.update(product_id, data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    service: ProductManagement = Depends(get_product_management),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        await service.delete_hard(product_id)
        return None
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
