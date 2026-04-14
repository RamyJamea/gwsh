from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, UniqueConstraint, Numeric
from .base import Base, AuditMixin

if TYPE_CHECKING:
    from .product import Product, Size, Extra
    from .branch import Branch
    from .order import OrderItem
    from .menu_item import MenuItem


class MenuItemExtra(Base, AuditMixin):
    __tablename__ = "menu_items_extras"

    menu_item_id: Mapped[int] = mapped_column(
        ForeignKey("menu_items.id", ondelete="CASCADE")
    )
    extra_id: Mapped[int] = mapped_column(ForeignKey("extras.id"))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    menu_item: Mapped["MenuItem"] = relationship(back_populates="menu_items_extras")
    extra: Mapped["Extra"] = relationship(back_populates="menu_item_extras")
