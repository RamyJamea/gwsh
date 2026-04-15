from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, AuditMixin
from ..core.enums import TableEnum

if TYPE_CHECKING:
    from .menu_item_extra import MenuItemExtraModel
    from .history_item import HistoryItemModel


class HistoryItemExtraModel(Base, AuditMixin):
    __tablename__ = TableEnum.HISTORIES_ITEMS_EXTRAS.value

    menu_item_extra_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.MENU_ITEMS_EXTRAS.value}.id"), index=True)
    order_history_item_id: Mapped[int] = mapped_column(
        ForeignKey(f"{TableEnum.HISTORIES_ITEMS.value}.id", ondelete="CASCADE"), index=True
    )

    quantity: Mapped[int]
    price_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    menu_item_extra: Mapped["MenuItemExtraModel"] = relationship(back_populates="histories_items_extras")
    history_item: Mapped["HistoryItemModel"] = relationship(back_populates="histories_items_extras")
