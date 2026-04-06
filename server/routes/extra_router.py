# NEW FILE: routers/extras.py
from fastapi import APIRouter, Depends, status
from ..core.schemas import ExtraCreate, ExtraResponse
from ..core.dependencies import get_extra_service, get_current_user, get_current_admin
from ..models import User
from ..services import ExtraService

router = APIRouter(prefix="/extras", tags=["Extras"])


@router.post("/", response_model=ExtraResponse, status_code=status.HTTP_201_CREATED)
def create_extra(
    data: ExtraCreate,
    current_admin: User = Depends(get_current_admin),
    service: ExtraService = Depends(get_extra_service),
):
    return service.create(data)


@router.get("/", response_model=list[ExtraResponse])
def list_extras(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    service: ExtraService = Depends(get_extra_service),
):
    return service.list(skip=skip, limit=limit)


@router.get("/{extra_id}", response_model=ExtraResponse)
def get_extra(
    extra_id: int,
    current_user: User = Depends(get_current_user),
    service: ExtraService = Depends(get_extra_service),
):
    return service.get(extra_id)


@router.put("/{extra_id}", response_model=ExtraResponse)
def update_extra(
    extra_id: int,
    data: ExtraCreate,
    current_admin: User = Depends(get_current_admin),
    service: ExtraService = Depends(get_extra_service),
):
    return service.update(extra_id, data)


@router.delete("/{extra_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_extra(
    extra_id: int,
    current_admin: User = Depends(get_current_admin),
    service: ExtraService = Depends(get_extra_service),
):
    service.delete(extra_id)
