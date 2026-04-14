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
    from .history_item import OrderHistoryItem


class OrderHistory(Base, AuditMixin):
    __tablename__ = "order_histories"

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    cashier_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[ActionEnum] = mapped_column(default=ActionEnum.CREATE)
    timestamp: Mapped[datetime] = mapped_column(server_default=func.now())
    total_amount_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    cashier: Mapped["User"] = relationship(back_populates="order_histories")
    order: Mapped["Order"] = relationship(back_populates="order_histories")
    order_history_items: Mapped[list["OrderHistoryItem"]] = relationship(
        back_populates="order_history",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
