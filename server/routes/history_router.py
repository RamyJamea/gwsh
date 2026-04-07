from fastapi import APIRouter, Depends, HTTPException, status
from ..models import User
from ..services import OrderService
from ..core.schemas import OrderHistoryResponse
from ..core.dependencies import get_current_user, get_order_service

router = APIRouter(prefix="/history", tags=["order-history"])


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
