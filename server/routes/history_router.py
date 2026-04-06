from fastapi import APIRouter, Depends
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
    return order_service.get_order_history(order_id)


@router.get("/{history_id}", response_model=OrderHistoryResponse)
def get_history_detail(
    history_id: int,
    current_user: User = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    return order_service.get_history_detail(history_id)
