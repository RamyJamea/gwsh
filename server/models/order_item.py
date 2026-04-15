from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.enums import TableEnum
from .base import Base, AuditMixin, ORPHAN

if TYPE_CHECKING:
    from .menu_item import MenuItemModel
    from .order import OrderModel
    from .order_item_extra import OrderItemExtraModel


class OrderItemModel(Base, AuditMixin):
    __tablename__ = TableEnum.ORDERS_ITEMS.value

    order_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.ORDERS.value}.id", ondelete="CASCADE"))
    menu_item_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.MENU_ITEMS.value}.id"))

    quantity: Mapped[int]
    price_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    menu_item: Mapped["MenuItemModel"] = relationship(back_populates="orders_items")
    order: Mapped["OrderModel"] = relationship(back_populates="orders_items")
    order_items_extras: Mapped[list["OrderItemExtraModel"]] = relationship(
        back_populates="order_item", cascade=ORPHAN, passive_deletes=True
    )
