from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..services import MenuService
from ..helpers.schemas.menu_schema import (
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemResponse,
    MenuItemDetailResponse,
)
from .utils import get_menu_service, get_current_user, RequirePermission, PermissionEnum
from ..models import UserModel

router = APIRouter(prefix="/menu-items", tags=["menu-items"])


@router.post("/", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    menu_item_in: MenuItemCreate,
    service: MenuService = Depends(get_menu_service),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        return await service.create(menu_item_in)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/", response_model=list[MenuItemResponse], status_code=status.HTTP_200_OK)
async def read_menu_items(
    skip: int = Query(default=0),
    limit: int = Query(default=100),
    service: MenuService = Depends(get_menu_service),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        return await service.get_all(skip=skip, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/branch/{branch_id}", response_model=list[MenuItemResponse], status_code=status.HTTP_200_OK)
async def read_menu_items_by_branch(
    branch_id: int,
    skip: int = Query(default=0),
    limit: int = Query(default=100),
    service: MenuService = Depends(get_menu_service),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        return await service.get_by_branch(branch_id=branch_id, skip=skip, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{menu_item_id}", response_model=MenuItemDetailResponse, status_code=status.HTTP_200_OK)
async def read_menu_item(
    menu_item_id: int,
    service: MenuService = Depends(get_menu_service),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        return await service.get(menu_item_id)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{menu_item_id}", response_model=MenuItemResponse, status_code=status.HTTP_200_OK)
async def update_menu_item(
    menu_item_id: int,
    menu_item_in: MenuItemUpdate,
    service: MenuService = Depends(get_menu_service),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        return await service.update(menu_item_id, menu_item_in)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{menu_item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    menu_item_id: int,
    service: MenuService = Depends(get_menu_service),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        await service.delete(menu_item_id)
        return None
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
