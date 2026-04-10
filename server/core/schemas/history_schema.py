from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, computed_field

from ..enums import ActionEnum
from .base_schema import AuditSchema


class ORMBaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class OrderHistoryItemExtraResponse(BaseModel):
    menu_item_extra_id: int
    quantity: int
    price_at_time: Decimal

    # hidden – used only for computed_field
    menu_item_extra: Any | None = Field(default=None, exclude=True)

    @computed_field
    def extra_name(self) -> str:
        if self.menu_item_extra and getattr(self.menu_item_extra, "extra", None):
            return self.menu_item_extra.extra.name
        return f"Extra #{self.menu_item_extra_id}"


class OrderHistoryItemResponse(BaseModel):
    menu_item_id: int
    quantity: int
    price_at_time: Decimal
    order_item_extras: list[OrderHistoryItemExtraResponse] = []

    # hidden – used only for computed_field
    menu_item: Any | None = Field(default=None, exclude=True)

    @computed_field
    def menu_item_name(self) -> str:
        if (
            self.menu_item
            and getattr(self.menu_item, "product", None)
            and getattr(self.menu_item, "size", None)
        ):
            return f"{self.menu_item.product.name} ({self.menu_item.size.name})"
        return f"MenuItem #{self.menu_item_id}"


class OrderHistoryResponse(AuditSchema):
    id: int
    order_id: int
    cashier_id: int
    action: ActionEnum
    timestamp: datetime
    total_amount_at_time: Decimal
    order_history_items: list[OrderHistoryItemResponse] = []

    # hidden – used only for computed_field
    cashier: Any | None = Field(default=None, exclude=True)

    @computed_field
    def cashier_name(self) -> str | None:
        if self.cashier:
            return getattr(self.cashier, "username", None)
        return None
