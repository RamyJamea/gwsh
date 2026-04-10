from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from .base_model import Base, AuditMixin

if TYPE_CHECKING:
    from .menu_model import MenuItem, MenuItemExtra


class Product(Base, AuditMixin):
    __tablename__ = "products"

    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    name: Mapped[str]

    category: Mapped["Category"] = relationship(back_populates="products")
    menu_items: Mapped[list["MenuItem"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class Category(Base, AuditMixin):
    __tablename__ = "categories"

    name: Mapped[str]

    products: Mapped[list["Product"]] = relationship(
        back_populates="category", cascade="all, delete-orphan"
    )


class Extra(Base, AuditMixin):
    __tablename__ = "extras"

    name: Mapped[str]

    menu_item_extras: Mapped[list["MenuItemExtra"]] = relationship(
        back_populates="extra", cascade="all, delete-orphan"
    )


class Size(Base, AuditMixin):
    __tablename__ = "sizes"

    name: Mapped[str]

    menu_items: Mapped[list["MenuItem"]] = relationship(
        back_populates="size", cascade="all, delete-orphan"
    )
