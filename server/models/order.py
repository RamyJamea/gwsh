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
    from .order_item import OrderItem


class Order(Base, AuditMixin):
    __tablename__ = "orders"

    cashier_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"), index=True)
    table_id: Mapped[int] = mapped_column(ForeignKey("tables.id"), nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    action: Mapped[ActionEnum] = mapped_column(default=ActionEnum.CREATE)
    payment_method: Mapped[PaymentEnum] = mapped_column(default=PaymentEnum.CASH)

    cashier: Mapped["User"] = relationship(back_populates="orders")
    branch: Mapped["Branch"] = relationship(back_populates="orders")
    order_items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    order_histories: Mapped[list["OrderHistory"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", passive_deletes=True
    )
    table: Mapped["RestaurantTable"] = relationship(back_populates="orders")





