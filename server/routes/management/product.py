from fastapi import APIRouter, Depends, status, Path, HTTPException, Query
from ...helpers.schemas import ProductCreate, ProductUpdate, ProductResponse
from ...services import ProductManagement
from ..utils import get_product_management, RequirePermission, PermissionEnum

router = APIRouter(prefix="/management/products", tags=["Management"])


@router.get("/{id}/", response_model=ProductResponse, status_code=status.HTTP_200_OK)
async def get_product_endpoint(
    id: str = Path(...),
    service: ProductManagement = Depends(get_product_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        product = await service.get(id)
        return ProductResponse.model_validate(product)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=list[ProductResponse], status_code=status.HTTP_200_OK)
async def get_products_endpoint(
    skip: int = Query(default=0),
    limit: int = Query(default=10),
    service: ProductManagement = Depends(get_product_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        products = await service.get_multi(skip, limit)
        return [ProductResponse.model_validate(product) for product in products]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product_endpoint(
    payload: ProductCreate,
    service: ProductManagement = Depends(get_product_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        new_product = await service.create(payload)
        return ProductResponse.model_validate(new_product)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put(
    "/{id}/", response_model=ProductResponse, status_code=status.HTTP_202_ACCEPTED
)
async def update_product_endpoint(
    payload: ProductUpdate,
    id: int = Path(...),
    service: ProductManagement = Depends(get_product_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        updated_product = await service.update(id, payload)
        return ProductResponse.model_validate(updated_product)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_endpoint(
    id: int = Path(...),
    service: ProductManagement = Depends(get_product_management),
    _=RequirePermission([PermissionEnum.MANAGE_CATALOG]),
):
    try:
        await service.delete_hard(id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
