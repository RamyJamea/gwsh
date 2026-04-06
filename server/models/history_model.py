from datetime import datetime
from decimal import Decimal
from sqlalchemy import ForeignKey, func, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base_model import Base, AuditMixin
from .order_model import Order
from .user_model import User
from ..core.enums import ActionEnum


class OrderHistory(Base, AuditMixin):
    __tablename__ = "order_histories"

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    cashier_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    action: Mapped[ActionEnum] = mapped_column(default=ActionEnum.CREATE)
    timestamp: Mapped[datetime] = mapped_column(server_default=func.now())
    total_amount_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    cashier: Mapped["User"] = relationship(back_populates="order_histories")
    order: Mapped["Order"] = relationship(back_populates="order_histories")
    order_history_items: Mapped[list["OrderHistoryItem"]] = relationship(
        back_populates="order_history"
    )


class OrderHistoryItem(Base, AuditMixin):
    __tablename__ = "order_history_items"

    order_history_id: Mapped[int] = mapped_column(ForeignKey("order_histories.id"))
    menu_item_id: Mapped[int] = mapped_column(ForeignKey("menu_items.id"))
    quantity: Mapped[int]
    price_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    order_history: Mapped["OrderHistory"] = relationship(
        back_populates="order_history_items"
    )
    order_item_extras: Mapped[list["OrderHistoryItemExtra"]] = relationship(
        back_populates="order_history_item"
    )


class OrderHistoryItemExtra(Base, AuditMixin):
    __tablename__ = "order_history_item_extras"

    order_history_item_id: Mapped[int] = mapped_column(
        ForeignKey("order_history_items.id")
    )
    menu_item_extra_id: Mapped[int] = mapped_column(ForeignKey("menu_items_extras.id"))
    quantity: Mapped[int]
    price_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    order_history_item: Mapped["OrderHistoryItem"] = relationship(
        back_populates="order_item_extras"
    )
