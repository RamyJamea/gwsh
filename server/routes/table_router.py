from fastapi import APIRouter, Depends, status, HTTPException, Query
from ..helpers.schemas.branch_schema import TableCreate, TableUpdate, TableRead
from ..services import TableService
from .utils import get_table_service, get_current_user, RequirePermission, PermissionEnum
from ..models import UserModel

router = APIRouter(prefix="/tables", tags=["tables"])


@router.get("/branch/{branch_id}", response_model=list[TableRead], status_code=status.HTTP_200_OK)
async def list_tables_by_branch(
    branch_id: int,
    skip: int = Query(default=0),
    limit: int = Query(default=100),
    table_service: TableService = Depends(get_table_service),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        return await table_service.get_tables_by_branch(branch_id, skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/branch/{branch_id}/available", response_model=list[TableRead], status_code=status.HTTP_200_OK)
async def list_available_tables_by_branch(
    branch_id: int,
    table_service: TableService = Depends(get_table_service),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        return await table_service.get_available_tables_by_branch(branch_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{table_id}", response_model=TableRead, status_code=status.HTTP_200_OK)
async def get_table(
    table_id: int,
    table_service: TableService = Depends(get_table_service),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        return await table_service.get(table_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/", response_model=TableRead, status_code=status.HTTP_201_CREATED)
async def create_table(
    table_in: TableCreate,
    table_service: TableService = Depends(get_table_service),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        return await table_service.create(table_in)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{table_id}", response_model=TableRead, status_code=status.HTTP_200_OK)
async def update_table(
    table_id: int,
    table_in: TableUpdate,
    table_service: TableService = Depends(get_table_service),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        return await table_service.update(table_id, table_in)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_table(
    table_id: int,
    table_service: TableService = Depends(get_table_service),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        await table_service.delete(table_id)
        return None
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
