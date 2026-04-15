from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from .base import Base, AuditMixin
from ..core.enums import TableEnum

if TYPE_CHECKING:
    from .extra import ExtraModel
    from .menu_item import MenuItemModel
    from .order_item_extra import OrderItemExtraModel
    from .history_item_extra import HistoryItemExtraModel


class MenuItemExtraModel(Base, AuditMixin):
    __tablename__ = TableEnum.MENU_ITEMS_EXTRAS.value
    __table_args__ = (
        UniqueConstraint("menu_item_id", "extra_id", name="uix_menu_item_extra"),
    )

    menu_item_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.MENU_ITEMS.value}.id", ondelete="CASCADE"))
    extra_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.EXTRAS.value}.id"), ondelete="CASCADE")
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    extra: Mapped["ExtraModel"] = relationship(back_populates="menu_items_extras")
    menu_item: Mapped["MenuItemModel"] = relationship(back_populates="menu_items_extras")
    orders_items_extras: Mapped[list["OrderItemExtraModel"]] = relationship(back_populates="menu_item_extra")
    histories_items_extras: Mapped[list["HistoryItemExtraModel"]] = relationship(back_populates="menu_item_extra")
