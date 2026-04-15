from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.enums import TableEnum
from .base import Base, AuditMixin, ORPHAN

if TYPE_CHECKING:
    from .menu_item import MenuItemModel
    from .history import HistoryModel
    from .history_item_extra import HistoryItemExtraModel


class HistoryItemModel(Base, AuditMixin):
    __tablename__ = TableEnum.HISTORIES_ITEMS.value

    history_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.HISTORIES.value}.id", ondelete="CASCADE"), index=True)
    menu_item_id: Mapped[int | None] = mapped_column(
        ForeignKey(f"{TableEnum.MENU_ITEMS.value}.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    quantity: Mapped[int]
    price_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    product_name: Mapped[str] = mapped_column(String(255))
    size_name: Mapped[str] = mapped_column(String(255))

    menu_item: Mapped["MenuItemModel"] = relationship(back_populates="histories_items")
    history: Mapped["HistoryModel"] = relationship(back_populates="history_items")
    histories_items_extras: Mapped[list["HistoryItemExtraModel"]] = relationship(
        back_populates="history_item", cascade=ORPHAN, passive_deletes=True
    )