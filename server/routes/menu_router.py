from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..models import User
from ..services import MenuService
from ..core.dependencies import get_current_user, get_current_admin, get_menu_service
from ..core.schemas import (
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemResponse,
    MenuItemDetailResponse,
)

router = APIRouter(prefix="/menu-items", tags=["menu-items"])


@router.post("/", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
def create_menu_item(
    menu_item_in: MenuItemCreate,
    service: MenuService = Depends(get_menu_service),
    current_admin: User = Depends(get_current_admin),
):
    try:
        return service.create(menu_item_in)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/", response_model=List[MenuItemResponse])
def read_menu_items(
    skip: int = 0,
    limit: int = 100,
    service: MenuService = Depends(get_menu_service),
    current_user: User = Depends(get_current_user),
):
    return service.list(skip=skip, limit=limit)


@router.get("/branch/{branch_id}", response_model=List[MenuItemResponse])
def read_menu_items_by_branch(
    branch_id: int,
    skip: int = 0,
    limit: int = 100,
    service: MenuService = Depends(get_menu_service),
    current_user: User = Depends(get_current_user),
):
    return service.repo.get_by_branch(
        branch_id=branch_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{menu_item_id}", response_model=MenuItemDetailResponse)
def read_menu_item(
    menu_item_id: int,
    service: MenuService = Depends(get_menu_service),
    current_user: User = Depends(get_current_user),
):
    menu_item = service.repo.get_menu_item_with_extras(menu_item_id)
    if menu_item is None:
        raise HTTPException(
            status_code=404,
            detail=f"Menu item {menu_item_id} not found",
        )
    return menu_item


@router.put("/{menu_item_id}", response_model=MenuItemResponse)
def update_menu_item(
    menu_item_id: int,
    menu_item_in: MenuItemUpdate,
    service: MenuService = Depends(get_menu_service),
    current_admin: User = Depends(get_current_admin),
):
    try:
        return service.update(menu_item_id, menu_item_in)
    except ValueError as exc:
        status_code = 404 if "not found" in str(exc).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc


@router.delete("/{menu_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(
    menu_item_id: int,
    service: MenuService = Depends(get_menu_service),
    current_admin: User = Depends(get_current_admin),
):
    try:
        service.delete(menu_item_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
