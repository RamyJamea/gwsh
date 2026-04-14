from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, UniqueConstraint, Numeric
from .base import Base, AuditMixin

if TYPE_CHECKING:
    from .product import Product, Size, Extra
    from .branch import Branch
    from .order import OrderItem
    from .menu_item_extra import MenuItemExtra


class MenuItem(Base, AuditMixin):
    __tablename__ = "menu_items"
    __table_args__ = (
        UniqueConstraint(
            "branch_id", "product_id", "size_id", name="uix_branch_product_size"
        ),
    )

    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    size_id: Mapped[int] = mapped_column(ForeignKey("sizes.id"))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    branch: Mapped["Branch"] = relationship(back_populates="menu_items")

    menu_items_extras: Mapped[list["MenuItemExtra"]] = relationship(
        back_populates="menu_item", cascade="all, delete-orphan", passive_deletes=True
    )

    product: Mapped["Product"] = relationship(back_populates="menu_items")
    size: Mapped["Size"] = relationship(back_populates="menu_items")
    order_items: Mapped[list["OrderItem"]] = relationship(
        back_populates="menu_item", cascade="all, delete-orphan"
    )
