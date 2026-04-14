from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.enums import ActionEnum, PaymentEnum
from .base import Base, AuditMixin

if TYPE_CHECKING:
    from .branch import Branch, RestaurantTable
    from .user import User
    from .history import OrderHistory
    from .menu_item_extra import MenuItem, MenuItemExtra
    from .order import Order
    from .order_item_extra import OrderItemExtra
class OrderItem(Base, AuditMixin):
    __tablename__ = "order_items"

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    menu_item_id: Mapped[int] = mapped_column(ForeignKey("menu_items.id"))
    quantity: Mapped[int]
    price_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    order: Mapped["Order"] = relationship(back_populates="order_items")
    order_item_extras: Mapped[list["OrderItemExtra"]] = relationship(
        back_populates="order_item", cascade="all, delete-orphan"
    )
    menu_item: Mapped["MenuItem"] = relationship(back_populates="order_items")
