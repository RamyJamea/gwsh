from decimal import Decimal
from pydantic import BaseModel
from .base_schema import AuditSchema
from .catalog_schema import ProductResponse, SizeResponse, ExtraResponse


class MenuItemExtraBase(BaseModel):
    price: Decimal


class MenuItemExtraCreate(MenuItemExtraBase):
    extra_id: int


class MenuItemExtraResponse(MenuItemExtraBase, AuditSchema):
    menu_item_id: int
    extra_id: int
    extra: ExtraResponse


class MenuItemBase(BaseModel):
    price: Decimal


class MenuItemCreate(MenuItemBase):
    branch_id: int
    product_id: int
    size_id: int
    extras: list[MenuItemExtraCreate] = []


class MenuItemUpdate(BaseModel):
    price: Decimal | None = None
    is_active: bool | None = None
    extras: list[MenuItemExtraCreate] | None = None


class MenuItemResponse(MenuItemBase, AuditSchema):
    branch_id: int
    product_id: int
    size_id: int


class MenuItemDetailResponse(MenuItemResponse):
    product: ProductResponse
    size: SizeResponse
    menu_items_extras: list[MenuItemExtraResponse] = []
