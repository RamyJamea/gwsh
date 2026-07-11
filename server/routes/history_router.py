from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from ..models import UserModel
from ..services import OrderHistoryService, OrderService
from ..helpers.schemas.history_schema import OrderHistoryResponse
from .utils import get_order_history_service, get_order_service, get_current_user, RequirePermission, PermissionEnum

router = APIRouter(prefix="/history", tags=["order-history"])


@router.get("/orders/{order_id}/export-excel", status_code=status.HTTP_200_OK)
async def export_order_history_excel(
    order_id: int,
    history_service: OrderHistoryService = Depends(get_order_history_service),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        excel_bytes = await history_service.export_detailed_history_to_excel(order_id)
        return StreamingResponse(
            BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="order_{order_id}_detailed_history.xlsx"'
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/branches/{branch_id}/export-excel", status_code=status.HTTP_200_OK)
async def export_branch_history_excel(
    branch_id: int,
    history_service: OrderHistoryService = Depends(get_order_history_service),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        excel_bytes = await history_service.export_detailed_history_for_branch(branch_id)
        return StreamingResponse(
            BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="branch_{branch_id}_detailed_history.xlsx"'
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.delete("/branches/{branch_id}/clear", status_code=status.HTTP_200_OK)
async def clear_branch_history(
    branch_id: int,
    order_service: OrderService = Depends(get_order_service),
    _=Depends(RequirePermission([PermissionEnum.MANAGE_CATALOG])),
):
    try:
        count = await order_service.clear_branch_history(branch_id)
        return {"message": f"Successfully deleted {count} historical records.", "count": count}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/orders/{order_id}", response_model=list[OrderHistoryResponse], status_code=status.HTTP_200_OK)
async def get_order_history(
    order_id: int,
    current_user: UserModel = Depends(get_current_user),
    history_service: OrderHistoryService = Depends(get_order_history_service),
):
    try:
        return await history_service.get_history_for_order(order_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/{history_id}", response_model=OrderHistoryResponse, status_code=status.HTTP_200_OK)
async def get_history_detail(
    history_id: int,
    current_user: UserModel = Depends(get_current_user),
    history_service: OrderHistoryService = Depends(get_order_history_service),
):
    try:
        return await history_service.get_history_detail(history_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
