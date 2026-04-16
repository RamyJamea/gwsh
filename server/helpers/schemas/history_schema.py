from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator, computed_field

from ..enums import ActionEnum
from .base import AuditSchema


class ORMBaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class OrderHistoryItemExtraResponse(BaseModel):
    menu_item_extra_id: int
    quantity: int
    price_at_time: Decimal
    extra_name: str | None = None

    # hidden – used only for fallback
    menu_item_extra: Any | None = Field(default=None, exclude=True)

    @model_validator(mode="after")
    def compute_extra_name(self) -> 'OrderHistoryItemExtraResponse':
        if not self.extra_name:
            if self.menu_item_extra and getattr(self.menu_item_extra, "extra", None):
                self.extra_name = self.menu_item_extra.extra.name
            else:
                self.extra_name = f"Extra #{self.menu_item_extra_id}"
        return self


class OrderHistoryItemResponse(BaseModel):
    menu_item_id: int
    quantity: int
    price_at_time: Decimal
    menu_item_name: str | None = None
    order_item_extras: list[OrderHistoryItemExtraResponse] = []

    # hidden – used only for fallback
    menu_item: Any | None = Field(default=None, exclude=True)

    @model_validator(mode="after")
    def compute_menu_item_name(self) -> 'OrderHistoryItemResponse':
        if not self.menu_item_name:
            if (
                self.menu_item
                and getattr(self.menu_item, "product", None)
                and getattr(self.menu_item, "size", None)
            ):
                self.menu_item_name = f"{self.menu_item.product.name} ({self.menu_item.size.name})"
            else:
                self.menu_item_name = f"MenuItem #{self.menu_item_id}"
        return self


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
