from fastapi import APIRouter, Depends, status
from ..core.schemas import TableCreate, TableUpdate, TableRead
from ..core.dependencies import get_table_service
from ..core.dependencies import get_current_user, get_current_admin, get_current_cashier
from ..services import TableService
from ..models import User

router = APIRouter(prefix="/tables", tags=["tables"])


@router.get("/branch/{branch_id}", response_model=list[TableRead])
def list_tables_by_branch(
    branch_id: int,
    skip: int = 0,
    limit: int = 100,
    table_service: TableService = Depends(get_table_service),
    current_user: User = Depends(get_current_user),
):
    return table_service.repo.get_tables_by_branch(branch_id, skip=skip, limit=limit)


@router.get("/branch/{branch_id}/available", response_model=list[TableRead])
def list_available_tables_by_branch(
    branch_id: int,
    table_service: TableService = Depends(get_table_service),
    current_user: User = Depends(get_current_user),
):
    return table_service.repo.get_available_tables_by_branch(branch_id)


@router.get("/{table_id}", response_model=TableRead)
def get_table(
    table_id: int,
    table_service: TableService = Depends(get_table_service),
    current_user: User = Depends(get_current_user),
):
    return table_service.get(table_id)


@router.post("/", response_model=TableRead, status_code=status.HTTP_201_CREATED)
def create_table(
    table_in: TableCreate,
    table_service: TableService = Depends(get_table_service),
    current_admin: User = Depends(get_current_admin),
):
    return table_service.create(table_in)


@router.patch("/{table_id}", response_model=TableRead)
def update_table(
    table_id: int,
    table_in: TableUpdate,
    table_service: TableService = Depends(get_table_service),
    current_cashier: User = Depends(get_current_cashier),
):
    return table_service.update(table_id, table_in)


@router.delete("/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_table(
    table_id: int,
    table_service: TableService = Depends(get_table_service),
    current_admin: User = Depends(get_current_admin),
):
    table_service.delete(table_id)
    return None
