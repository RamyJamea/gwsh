from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.enums import ActionEnum, PaymentEnum
from .base_model import Base, AuditMixin

if TYPE_CHECKING:
    from .branch_model import Branch, RestaurantTable
    from .user_model import User
    from .history_model import OrderHistory
    from .menu_model import MenuItem


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


class OrderItemExtra(Base, AuditMixin):
    __tablename__ = "order_item_extras"

    order_item_id: Mapped[int] = mapped_column(ForeignKey("order_items.id"))
    menu_item_extra_id: Mapped[int] = mapped_column(ForeignKey("menu_items_extras.id"))
    quantity: Mapped[int]
    price_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    order_item: Mapped["OrderItem"] = relationship(back_populates="order_item_extras")
