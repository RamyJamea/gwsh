from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.enums import TableEnum
from .base import Base, AuditMixin, ORPHAN

if TYPE_CHECKING:
    from .menu_item_extra import MenuItemModel
    from .history import OrderHistoryModel
    from .history_item_extra import OrderHistoryItemExtraModel

class OrderHistoryItemModel(Base, AuditMixin):
    __tablename__ = TableEnum.ORDERS_HISTORIES_ITEMS.value

    order_history_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.ORDERS_HISTORIES.value}.id", ondelete="CASCADE"), index=True)
    menu_item_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.MENU_ITEMS.value}.id"), index=True)
    
    quantity: Mapped[int]
    price_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    menu_item: Mapped["MenuItemModel"] = relationship(back_populates="orders_histories_items")
    order_history: Mapped["OrderHistoryModel"] = relationship(back_populates="orders_histories_items")
    orders_items_extras: Mapped[list["OrderHistoryItemExtraModel"]] = relationship(
        back_populates="order_history_item", cascade=ORPHAN, passive_deletes=True
    )
