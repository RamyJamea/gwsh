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
    from .history_item import OrderHistoryItem
class OrderHistoryItemExtra(Base, AuditMixin):
    __tablename__ = "order_history_item_extras"

    order_history_item_id: Mapped[int] = mapped_column(
        ForeignKey("order_history_items.id", ondelete="CASCADE")
    )
    menu_item_extra_id: Mapped[int] = mapped_column(ForeignKey("menu_items_extras.id"))
    extra_name: Mapped[str] = mapped_column(nullable=True)
    quantity: Mapped[int]
    price_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    menu_item_extra: Mapped["MenuItemExtra"] = relationship()
    order_history_item: Mapped["OrderHistoryItem"] = relationship(
        back_populates="order_item_extras"
    )