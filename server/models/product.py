from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String
from .base import Base, AuditMixin, ORPHAN
from ..core.enums import TableEnum

if TYPE_CHECKING:
    from .menu_item import MenuItemModel
    from .category import CategoryModel


class ProductModel(Base, AuditMixin):
    __tablename__ = TableEnum.PRODUCTS.value

    category_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.CATEGORIES.value}.id"), ondelete="CASCADE")
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    image_url: Mapped[str | None] = mapped_column(String(255), default=None)

    category: Mapped["CategoryModel"] = relationship(back_populates="products")
    menu_items: Mapped[list["MenuItemModel"]] = relationship(back_populates="product", cascade=ORPHAN)
