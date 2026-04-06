from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from .base_model import Base, AuditMixin
from .menu_model import MenuItem, MenuItemExtra


class Product(Base, AuditMixin):
    __tablename__ = "products"

    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    name: Mapped[str]

    category: Mapped["Category"] = relationship(back_populates="products")
    menu_items: Mapped[list["MenuItem"]] = relationship(back_populates="product")


class Category(Base, AuditMixin):
    __tablename__ = "categories"

    name: Mapped[str]

    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Extra(Base, AuditMixin):
    __tablename__ = "extras"

    name: Mapped[str]

    menu_item_extras: Mapped[list["MenuItemExtra"]] = relationship(
        back_populates="extra"
    )


class Size(Base, AuditMixin):
    __tablename__ = "sizes"

    name: Mapped[str]

    menu_items: Mapped[list["MenuItem"]] = relationship(back_populates="size")
