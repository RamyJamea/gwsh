from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from ..models import User
from ..services import OrderService
from ..core.schemas import OrderHistoryResponse
from ..core.dependencies import get_current_user, get_order_service, get_current_admin

router = APIRouter(prefix="/history", tags=["order-history"])


@router.get("/orders/{order_id}/export-excel")
def export_order_history_excel(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    order_service: OrderService = Depends(get_order_service),
):
    """Download full detailed history of an order as an Excel file (.xlsx)."""
    try:
        excel_bytes = order_service.export_detailed_history_to_excel(order_id)
        return StreamingResponse(
            BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="order_{order_id}_detailed_history.xlsx"'
            },
        )
    except ValueError as exc:
        status_code = 404 if "not found" in str(exc).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc


# NEW ENDPOINT: Per-branch full history export (admin only)
@router.get("/branches/{branch_id}/export-excel")
def export_branch_history_excel(
    branch_id: int,
    current_admin: User = Depends(get_current_admin),
    order_service: OrderService = Depends(get_order_service),
):
    """Download full detailed history of ALL orders in a branch as an Excel file (.xlsx).
    Contains three sheets: Orders Overview, History Summary, and Detailed Items & Extras.
    """
    try:
        excel_bytes = order_service.export_detailed_history_for_branch(branch_id)
        return StreamingResponse(
            BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="branch_{branch_id}_detailed_history.xlsx"'
            },
        )
    except ValueError as exc:
        status_code = 404 if "not found" in str(exc).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc


@router.delete("/branches/{branch_id}/clear")
def clear_branch_history(
    branch_id: int,
    current_admin: User = Depends(get_current_admin),
    order_service: OrderService = Depends(get_order_service),
):
    """Clear all completed/cancelled orders for a branch (admin only)."""
    try:
        count = order_service.clear_branch_history(branch_id)
        return {"message": f"Successfully deleted {count} historical records.", "count": count}
    except ValueError as exc:
        status_code = 404 if "not found" in str(exc).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc


@router.get("/orders/{order_id}", response_model=list[OrderHistoryResponse])
def get_order_history(
    order_id: int,
    current_user: User = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    try:
        return order_service.get_order_history(order_id)
    except ValueError as exc:
        status_code = 404 if "not found" in str(exc).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc


@router.get("/{history_id}", response_model=OrderHistoryResponse)
def get_history_detail(
    history_id: int,
    current_user: User = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    try:
        return order_service.get_history_detail(history_id)
    except ValueError as exc:
        status_code = 404 if "not found" in str(exc).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc
