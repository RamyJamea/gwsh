from fastapi import APIRouter, Depends, HTTPException, status
from ..services import BranchService
from ..models import User
from ..helpers.schemas import BranchCreate, BranchUpdate, BranchRead
from ..helpers.auth import get_current_user, get_current_admin, get_branch_service

router = APIRouter(prefix="/branches", tags=["branches"])


@router.get("/", response_model=list[BranchRead])
def list_branches(
    skip: int = 0,
    limit: int = 100,
    branch_service: BranchService = Depends(get_branch_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return branch_service.list(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{branch_id}", response_model=BranchRead)
def get_branch(
    branch_id: int,
    branch_service: BranchService = Depends(get_branch_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return branch_service.get(branch_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/", response_model=BranchRead, status_code=status.HTTP_201_CREATED)
def create_branch(
    branch_in: BranchCreate,
    branch_service: BranchService = Depends(get_branch_service),
    current_admin: User = Depends(get_current_admin),
):
    try:
        return branch_service.create(branch_in)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{branch_id}", response_model=BranchRead)
def update_branch(
    branch_id: int,
    branch_in: BranchUpdate,
    branch_service: BranchService = Depends(get_branch_service),
    current_admin: User = Depends(get_current_admin),
):
    try:
        return branch_service.update(branch_id, branch_in)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{branch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_branch(
    branch_id: int,
    branch_service: BranchService = Depends(get_branch_service),
    current_admin: User = Depends(get_current_admin),
):
    try:
        branch_service.delete(branch_id)
        return None
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
