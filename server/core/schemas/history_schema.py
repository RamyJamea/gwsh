from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel
from ..enums import ActionEnum
from .base_schema import AuditSchema


class OrderHistoryItemExtraResponse(BaseModel):
    menu_item_extra_id: int
    quantity: int
    price_at_time: Decimal


class OrderHistoryItemResponse(BaseModel):
    menu_item_id: int
    quantity: int
    price_at_time: Decimal
    order_item_extras: list[OrderHistoryItemExtraResponse] = []


class OrderHistoryResponse(AuditSchema):
    id: int
    order_id: int
    cashier_id: int
    action: ActionEnum
    timestamp: datetime
    total_amount_at_time: Decimal
    order_history_items: list[OrderHistoryItemResponse] = []
