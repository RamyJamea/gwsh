from fastapi import APIRouter, Depends, status, HTTPException
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
    try:
        return table_service.repo.get_tables_by_branch(
            branch_id, skip=skip, limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/branch/{branch_id}/available", response_model=list[TableRead])
def list_available_tables_by_branch(
    branch_id: int,
    table_service: TableService = Depends(get_table_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return table_service.repo.get_available_tables_by_branch(branch_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{table_id}", response_model=TableRead)
def get_table(
    table_id: int,
    table_service: TableService = Depends(get_table_service),
    current_user: User = Depends(get_current_user),
):
    try:
        table = table_service.get(table_id)
        if table is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Table not found"
            )
        return table
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/", response_model=TableRead, status_code=status.HTTP_201_CREATED)
def create_table(
    table_in: TableCreate,
    table_service: TableService = Depends(get_table_service),
    current_admin: User = Depends(get_current_admin),
):
    try:
        return table_service.create(table_in)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{table_id}", response_model=TableRead)
def update_table(
    table_id: int,
    table_in: TableUpdate,
    table_service: TableService = Depends(get_table_service),
    current_cashier: User = Depends(get_current_cashier),
):
    try:
        if table_service.get(table_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Table not found"
            )
        return table_service.update(table_id, table_in)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_table(
    table_id: int,
    table_service: TableService = Depends(get_table_service),
    current_admin: User = Depends(get_current_admin),
):
    try:
        if table_service.get(table_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Table not found"
            )
        table_service.delete(table_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
