from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Annotated
from ..core.enums import RoleEnum
from ..models import User
from ..services import OrderService
from ..core.dependencies import get_current_cashier, get_current_user, get_order_service
from ..core.schemas.order_schema import *

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


@router.post(
    "/{order_id}/checkout",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_200_OK,
)
def checkout_order(
    order_id: int,
    checkout_in: OrderCheckout,
    current_user: User = Depends(get_current_cashier),
    order_service: OrderService = Depends(get_order_service),
):
    return order_service.checkout(
        order_id=order_id,
        cashier_id=current_user.id,
        payment_method=checkout_in.payment_method,
    )


@router.post(
    "/{order_id}/cancel",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_200_OK,
)
def cancel_order(
    order_id: int,
    cancel_in: OrderCancel | None = None,
    current_user: User = Depends(get_current_cashier),
    order_service: OrderService = Depends(get_order_service),
):
    return order_service.cancel(
        order_id=order_id,
        cashier_id=current_user.id,
        reason=cancel_in.reason if cancel_in else None,
    )


@router.post(
    "/{order_id}/items",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_200_OK,
)
def add_order_items(
    order_id: int,
    items_in: OrderItemsAdd,
    current_user: User = Depends(get_current_cashier),
    order_service: OrderService = Depends(get_order_service),
):
    return order_service.add_items(
        order_id=order_id,
        items_in=items_in.items,
        cashier_id=current_user.id,
    )


@router.patch(
    "/{order_id}/items/{order_item_id}",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_200_OK,
)
def update_order_item_quantity(
    order_id: int,
    order_item_id: int,
    quantity_in: OrderItemQuantityUpdate,
    current_user: User = Depends(get_current_cashier),
    order_service: OrderService = Depends(get_order_service),
):
    return order_service.update_item_quantity(
        order_id=order_id,
        order_item_id=order_item_id,
        quantity=quantity_in.quantity,
        cashier_id=current_user.id,
    )


@router.delete(
    "/{order_id}/items/{order_item_id}",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_200_OK,
)
def remove_order_item(
    order_id: int,
    order_item_id: int,
    current_user: User = Depends(get_current_cashier),
    order_service: OrderService = Depends(get_order_service),
):
    return order_service.remove_item(
        order_id=order_id,
        order_item_id=order_item_id,
        cashier_id=current_user.id,
    )


@router.patch(
    "/{order_id}/table",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_200_OK,
)
def update_order_table(
    order_id: int,
    table_in: OrderTableUpdate,
    current_user: User = Depends(get_current_cashier),
    order_service: OrderService = Depends(get_order_service),
):
    return order_service.update_table(
        order_id=order_id,
        table_id=table_in.table_id,
        cashier_id=current_user.id,
    )
