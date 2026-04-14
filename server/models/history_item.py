from typing import TYPE_CHECKING
from datetime import datetime
from decimal import Decimal
from sqlalchemy import ForeignKey, func, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.enums import ActionEnum
from .base import Base, AuditMixin

if TYPE_CHECKING:
    from .order import Order
    from .user import User
    from .menu_item_extra import MenuItem, MenuItemExtra
    from .history import OrderHistory
    from .history_item_extra import OrderHistoryItemExtra

class OrderHistoryItem(Base, AuditMixin):
    __tablename__ = "order_history_items"

    order_history_id: Mapped[int] = mapped_column(
        ForeignKey("order_histories.id", ondelete="CASCADE")
    )
    menu_item_id: Mapped[int] = mapped_column(ForeignKey("menu_items.id"))
    menu_item_name: Mapped[str] = mapped_column(nullable=True)
    quantity: Mapped[int]
    price_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    menu_item: Mapped["MenuItem"] = relationship()
    order_history: Mapped["OrderHistory"] = relationship(
        back_populates="order_history_items"
    )
    order_item_extras: Mapped[list["OrderHistoryItemExtra"]] = relationship(
        back_populates="order_history_item",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
