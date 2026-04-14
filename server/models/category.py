from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from .base import Base, AuditMixin

if TYPE_CHECKING:
    from .menu_item_extra import MenuItem, MenuItemExtra
    from .product import Product


class Category(Base, AuditMixin):
    __tablename__ = "categories"

    name: Mapped[str]

    products: Mapped[list["Product"]] = relationship(
        back_populates="category", cascade="all, delete-orphan"
    )
