from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from .base import Base, AuditMixin

if TYPE_CHECKING:
    from .menu_item_extra import MenuItem, MenuItemExtra
    from .category import Category


class Extra(Base, AuditMixin):
    __tablename__ = "extras"

    name: Mapped[str]

    menu_item_extras: Mapped[list["MenuItemExtra"]] = relationship(
        back_populates="extra", cascade="all, delete-orphan"
    )
