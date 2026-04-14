from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.enums import ActionEnum, PaymentEnum
from .base import Base, AuditMixin
from .order_item import OrderItem

if TYPE_CHECKING:
    from .branch import Branch, RestaurantTable
    from .user import User
    from .history import OrderHistory
    from .menu_item_extra import MenuItem, MenuItemExtra


class OrderItemExtra(Base, AuditMixin):
    __tablename__ = "order_item_extras"

    order_item_id: Mapped[int] = mapped_column(ForeignKey("order_items.id"))
    menu_item_extra_id: Mapped[int] = mapped_column(ForeignKey("menu_items_extras.id"))
    quantity: Mapped[int]
    price_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    order_item: Mapped["OrderItem"] = relationship(back_populates="order_item_extras")
    menu_item_extra: Mapped["MenuItemExtra"] = relationship()
