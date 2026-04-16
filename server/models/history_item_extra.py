from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, AuditMixin
from ..helpers.enums import TableEnum

if TYPE_CHECKING:
    from .menu_item_extra import MenuItemExtraModel
    from .history_item import HistoryItemModel


class HistoryItemExtraModel(Base, AuditMixin):
    __tablename__ = TableEnum.HISTORIES_ITEMS_EXTRAS.value

    menu_item_extra_id: Mapped[int | None] = mapped_column(
        ForeignKey(f"{TableEnum.MENU_ITEMS_EXTRAS.value}.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    history_item_id: Mapped[int] = mapped_column(
        ForeignKey(f"{TableEnum.HISTORIES_ITEMS.value}.id", ondelete="CASCADE"), index=True
    )

    quantity: Mapped[int] = mapped_column()
    price_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    extra_name: Mapped[str] = mapped_column(String(255))

    menu_item_extra: Mapped["MenuItemExtraModel"] = relationship(back_populates="histories_items_extras")
    history_item: Mapped["HistoryItemModel"] = relationship(back_populates="histories_items_extras")