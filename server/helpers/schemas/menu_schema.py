from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field
from .base import AuditSchema
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
    extras: List[MenuItemExtraCreate] = Field(default_factory=list)


class MenuItemUpdate(BaseModel):
    """
    Partial update for MenuItem.
    - All fields are optional → true PATCH-style updates
    - You can now safely change branch, product, or size
    - Extras are completely replaced when sent
    """

    branch_id: Optional[int] = Field(None, description="Change branch")
    product_id: Optional[int] = Field(None, description="Change product")
    size_id: Optional[int] = Field(None, description="Change size")
    price: Optional[Decimal] = Field(None, description="New price")
    is_active: Optional[bool] = Field(None, description="Activate/deactivate")
    extras: Optional[List[MenuItemExtraCreate]] = Field(
        None,
        description="If provided, completely replaces all existing extras. "
        "Send empty list [] to remove all extras.",
    )


class MenuItemResponse(MenuItemBase, AuditSchema):
    branch_id: int
    product_id: int
    size_id: int
    # is_active: bool  # ← added for consistency with update


class MenuItemDetailResponse(MenuItemResponse):
    product: ProductResponse
    size: SizeResponse
    menu_items_extras: List[MenuItemExtraResponse] = Field(default_factory=list)
