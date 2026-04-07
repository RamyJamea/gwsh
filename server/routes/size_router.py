from fastapi import APIRouter, Depends, status, HTTPException
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
    try:
        return service.create(data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=list[SizeResponse])
def list_sizes(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    service: SizeService = Depends(get_size_service),
):
    try:
        return service.list(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{size_id}", response_model=SizeResponse)
def get_size(
    size_id: int,
    current_user: User = Depends(get_current_user),
    service: SizeService = Depends(get_size_service),
):
    try:
        size = service.get(size_id)
        if size is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Size not found"
            )
        return size
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{size_id}", response_model=SizeResponse)
def update_size(
    size_id: int,
    data: SizeCreate,
    current_admin: User = Depends(get_current_admin),
    service: SizeService = Depends(get_size_service),
):
    try:
        if service.get(size_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Size not found"
            )
        return service.update(size_id, data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{size_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_size(
    size_id: int,
    current_admin: User = Depends(get_current_admin),
    service: SizeService = Depends(get_size_service),
):
    try:
        if service.get(size_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Size not found"
            )
        service.delete(size_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
