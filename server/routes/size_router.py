from fastapi import APIRouter, Depends, status
from ..core.schemas import SizeCreate, SizeResponse
from ..core.dependencies import get_size_service, get_current_user, get_current_admin
from ..models import User
from ..services import SizeService

router = APIRouter(prefix="/sizes", tags=["Sizes"])


@router.post("/", response_model=SizeResponse, status_code=status.HTTP_201_CREATED)
def create_size(
    data: SizeCreate,
    current_admin: User = Depends(get_current_admin),
    service: SizeService = Depends(get_size_service),
):
    return service.create(data)


@router.get("/", response_model=list[SizeResponse])
def list_sizes(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    service: SizeService = Depends(get_size_service),
):
    return service.list(skip=skip, limit=limit)


@router.get("/{size_id}", response_model=SizeResponse)
def get_size(
    size_id: int,
    current_user: User = Depends(get_current_user),
    service: SizeService = Depends(get_size_service),
):
    return service.get(size_id)


@router.put("/{size_id}", response_model=SizeResponse)
def update_size(
    size_id: int,
    data: SizeCreate,
    current_admin: User = Depends(get_current_admin),
    service: SizeService = Depends(get_size_service),
):
    return service.update(size_id, data)


@router.delete("/{size_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_size(
    size_id: int,
    current_admin: User = Depends(get_current_admin),
    service: SizeService = Depends(get_size_service),
):
    service.delete(size_id)
