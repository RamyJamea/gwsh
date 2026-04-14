from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from .base import Base, AuditMixin

if TYPE_CHECKING:
    from .menu_item_extra import MenuItem, MenuItemExtra
    from .category import Category

class Product(Base, AuditMixin):
    __tablename__ = "products"

    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    name: Mapped[str]
    image_url: Mapped[str | None] = mapped_column(default=None)

    category: Mapped["Category"] = relationship(back_populates="products")
    menu_items: Mapped[list["MenuItem"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )





