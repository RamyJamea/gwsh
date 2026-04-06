from fastapi import APIRouter, Depends, status
from ..core.schemas import ProductCreate, ProductUpdate, ProductResponse
from ..core.dependencies import get_product_service, get_current_user, get_current_admin
from ..models import User
from ..services import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    current_admin: User = Depends(get_current_admin),
    service: ProductService = Depends(get_product_service),
):
    return service.create(data)


@router.get("/", response_model=list[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    service: ProductService = Depends(get_product_service),
):
    return service.list(skip=skip, limit=limit)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    service: ProductService = Depends(get_product_service),
):
    return service.get(product_id)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    current_admin: User = Depends(get_current_admin),
    service: ProductService = Depends(get_product_service),
):
    return service.update(product_id, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_admin: User = Depends(get_current_admin),
    service: ProductService = Depends(get_product_service),
):
    service.delete(product_id)
