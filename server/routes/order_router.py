from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Annotated
from ..core.enums import RoleEnum
from ..models import User
from ..services import OrderService
from ..core.dependencies import get_current_cashier, get_current_user, get_order_service
from ..core.schemas.order_schema import (
    OrderCreate,
    OrderDetailResponse,
    OrderResponse,
    OrderUpdate,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post(
    "/", response_model=OrderDetailResponse, status_code=status.HTTP_201_CREATED
)
def create_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_cashier),
    order_service: OrderService = Depends(get_order_service),
):
    if order_in.cashier_id != current_user.id:
        order_in = order_in.model_copy(update={"cashier_id": current_user.id})

    return order_service.create(order_in)


@router.get("/{order_id}", response_model=OrderDetailResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    return order_service.get_detail(order_id)


@router.get("/", response_model=list[OrderResponse])
def list_orders(
    branch_id: Annotated[int, Query(..., description="Filter by branch ID")],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    current_user: User = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    if current_user.role == RoleEnum.CASHIER and branch_id != current_user.branch_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view orders from your own branch",
        )

    return order_service.list_by_branch(branch_id, skip=skip, limit=limit)


@router.patch("/{order_id}", response_model=OrderDetailResponse)
def update_order(
    order_id: int,
    order_update: OrderUpdate,
    current_user: User = Depends(get_current_cashier),
    order_service: OrderService = Depends(get_order_service),
):
    return order_service.update(order_id, order_update, cashier_id=current_user.id)
