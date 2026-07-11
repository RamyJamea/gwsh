from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Annotated
from ..helpers.enums import RoleEnum, PaymentEnum
from ..models import UserModel
from ..services import OrderService
from .utils import get_order_service, get_current_user
from ..helpers.schemas.order_schema import (
    OrderCreate, OrderUpdate, OrderCheckout, OrderCancel, OrderItemsAdd,
    OrderItemQuantityUpdate, OrderTableUpdate, OrderResponse, OrderDetailResponse
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=OrderDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    current_user: UserModel = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    # Ensure cashier_id matches the current user if they are cashier
    if current_user.role == RoleEnum.CASHIER:
        order_in = order_in.model_copy(update={"cashier_id": current_user.id})
    try:
        return await order_service.create(order_in, cashier_id=current_user.id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/{order_id}", response_model=OrderDetailResponse, status_code=status.HTTP_200_OK)
async def get_order(
    order_id: int,
    current_user: UserModel = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    try:
        return await order_service.get(order_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get("/", response_model=list[OrderResponse], status_code=status.HTTP_200_OK)
async def list_orders(
    branch_id: Annotated[int, Query(..., description="Filter by branch ID")],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: int = Query(500, ge=1, le=1000),
    current_user: UserModel = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    if current_user.role == RoleEnum.CASHIER and branch_id != current_user.branch_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view orders from your own branch",
        )
    try:
        return await order_service.list_by_branch(branch_id, skip=skip, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.patch("/{order_id}", response_model=OrderDetailResponse, status_code=status.HTTP_200_OK)
async def update_order(
    order_id: int,
    order_update: OrderUpdate,
    current_user: UserModel = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    try:
        return await order_service.update_status(order_id, order_update, cashier_id=current_user.id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/{order_id}/checkout", response_model=OrderDetailResponse, status_code=status.HTTP_200_OK)
async def checkout_order(
    order_id: int,
    checkout_in: OrderCheckout,
    current_user: UserModel = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    try:
        return await order_service.checkout(
            order_id=order_id,
            cashier_id=current_user.id,
            payment_method=checkout_in.payment_method,
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/{order_id}/cancel", response_model=OrderDetailResponse, status_code=status.HTTP_200_OK)
async def cancel_order(
    order_id: int,
    cancel_in: OrderCancel | None = None,
    current_user: UserModel = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    try:
        return await order_service.cancel(
            order_id=order_id,
            cashier_id=current_user.id,
            reason=cancel_in.reason if cancel_in else None,
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/{order_id}/items", response_model=OrderDetailResponse, status_code=status.HTTP_200_OK)
async def add_order_items(
    order_id: int,
    items_in: OrderItemsAdd,
    current_user: UserModel = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    try:
        return await order_service.add_items(
            order_id=order_id,
            items=items_in.items,
            cashier_id=current_user.id,
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.patch("/{order_id}/items/{order_item_id}", response_model=OrderDetailResponse, status_code=status.HTTP_200_OK)
async def update_order_item_quantity(
    order_id: int,
    order_item_id: int,
    quantity_in: OrderItemQuantityUpdate,
    current_user: UserModel = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    try:
        return await order_service.update_item_quantity(
            order_id=order_id,
            order_item_id=order_item_id,
            quantity=quantity_in.quantity,
            cashier_id=current_user.id,
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.delete("/{order_id}/items/{order_item_id}", response_model=OrderDetailResponse, status_code=status.HTTP_200_OK)
async def remove_order_item(
    order_id: int,
    order_item_id: int,
    current_user: UserModel = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    try:
        return await order_service.remove_item(
            order_id=order_id,
            order_item_id=order_item_id,
            cashier_id=current_user.id,
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.patch("/{order_id}/table", response_model=OrderDetailResponse, status_code=status.HTTP_200_OK)
async def update_order_table(
    order_id: int,
    table_in: OrderTableUpdate,
    current_user: UserModel = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    try:
        return await order_service.update_table(
            order_id=order_id,
            table_id=table_in.table_id,
            cashier_id=current_user.id,
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
