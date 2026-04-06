from fastapi import APIRouter, Depends, status
from ..core.schemas import CategoryCreate, CategoryUpdate, CategoryResponse
from ..core.schemas import ProductResponse
from ..core.dependencies import get_category_service, get_product_service
from ..core.dependencies import get_current_user, get_current_admin
from ..models import User
from ..services import CategoryService, ProductService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    current_admin: User = Depends(get_current_admin),
    service: CategoryService = Depends(get_category_service),
):
    return service.create(data)


@router.get("/", response_model=list[CategoryResponse])
def list_categories(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service),
):
    return service.list(skip=skip, limit=limit)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service),
):
    return service.get(category_id)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    current_admin: User = Depends(get_current_admin),
    service: CategoryService = Depends(get_category_service),
):
    return service.update(category_id, data)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    current_admin: User = Depends(get_current_admin),
    service: CategoryService = Depends(get_category_service),
):
    service.delete(category_id)


@router.get("/{category_id}/products", response_model=list[ProductResponse])
def get_products_by_category(
    category_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    product_service: ProductService = Depends(get_product_service),
):
    return product_service.list_by_category(category_id, skip, limit)
