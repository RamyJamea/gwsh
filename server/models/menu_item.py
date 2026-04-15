from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, UniqueConstraint, Numeric
from .base import Base, AuditMixin, ORPHAN
from ..core.enums import TableEnum

if TYPE_CHECKING:
    from .product import ProductModel
    from .size import SizeModel
    from .branch import BranchModel
    from .order import OrderItemModel
    from .history_item import OrderHistoryItemModel
    from .menu_item_extra import MenuItemExtraModel


class MenuItemModel(Base, AuditMixin):
    __tablename__ = TableEnum.MENU_ITEMS.value
    __table_args__ = tuple(
        UniqueConstraint(
            "branch_id", "product_id", "size_id", name="uix_branch_product_size"
        )
    )

    product_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.PRODUCTS.value}.id"))
    branch_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.BRANCHES.value}.id"))
    size_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.SIZES.value}.id"))

    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    branch: Mapped["BranchModel"] = relationship(back_populates="menu_items")
    product: Mapped["ProductModel"] = relationship(back_populates="menu_items")
    size: Mapped["SizeModel"] = relationship(back_populates="menu_items")
    orders_items: Mapped[list["OrderItemModel"]] = relationship(back_populates="menu_item")
    orders_histories_items: Mapped[list["OrderHistoryItemModel"]] = relationship(back_populates="menu_item")
    menu_items_extras: Mapped[list["MenuItemExtraModel"]] = relationship(
        back_populates="menu_item", cascade=ORPHAN, passive_deletes=True
    )
