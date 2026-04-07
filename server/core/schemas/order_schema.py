from decimal import Decimal
from pydantic import BaseModel
from ..enums import ActionEnum, PaymentEnum
from .base_schema import AuditSchema
from .menu_schema import MenuItemResponse


class OrderItemExtraBase(BaseModel):
    quantity: int
    price_at_time: Decimal


class OrderItemExtraCreate(OrderItemExtraBase):
    menu_item_extra_id: int


class OrderItemExtraResponse(OrderItemExtraBase, AuditSchema):
    order_item_id: int
    menu_item_extra_id: int


class OrderItemBase(BaseModel):
    quantity: int
    price_at_time: Decimal


class OrderItemCreate(OrderItemBase):
    menu_item_id: int
    extras: list[OrderItemExtraCreate] = []


class OrderItemResponse(OrderItemBase, AuditSchema):
    order_id: int
    menu_item_id: int


class OrderItemDetailResponse(OrderItemResponse):
    menu_item: MenuItemResponse
    order_item_extras: list[OrderItemExtraResponse] = []


class OrderBase(BaseModel):
    total_amount: Decimal
    action: ActionEnum = ActionEnum.CREATE
    payment_method: PaymentEnum | None = None


class OrderCreate(OrderBase):
    cashier_id: int
    branch_id: int
    table_id: int | None = None
    items: list[OrderItemCreate]


class OrderUpdate(BaseModel):
    payment_method: PaymentEnum | None = None


class OrderCheckout(BaseModel):
    payment_method: PaymentEnum = PaymentEnum.CASH


class OrderCancel(BaseModel):
    reason: str | None = None


class OrderResponse(OrderBase, AuditSchema):
    cashier_id: int
    branch_id: int
    table_id: int | None


class OrderDetailResponse(OrderResponse):
    order_items: list[OrderItemDetailResponse] = []


class OrderItemsAdd(BaseModel):
    items: list[OrderItemCreate]


class OrderItemQuantityUpdate(BaseModel):
    quantity: int


class OrderTableUpdate(BaseModel):
    table_id: int | None = None
