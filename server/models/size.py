from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from .base import Base, AuditMixin

if TYPE_CHECKING:
    from .menu_item_extra import MenuItem, MenuItemExtra
    from .category import Category


class Size(Base, AuditMixin):
    __tablename__ = "sizes"

    name: Mapped[str]

    menu_items: Mapped[list["MenuItem"]] = relationship(
        back_populates="size", cascade="all, delete-orphan"
    )
