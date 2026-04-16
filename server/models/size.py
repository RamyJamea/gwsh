from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from .base import Base, AuditMixin, ORPHAN
from ..helpers.enums import TableEnum

if TYPE_CHECKING:
    from .menu_item import MenuItemModel


class SizeModel(Base, AuditMixin):
    __tablename__ = TableEnum.SIZES.value

    name: Mapped[str] = mapped_column(String(255), index=True, unique=True)
    
    menu_items: Mapped[list["MenuItemModel"]] = relationship(back_populates="size", cascade=ORPHAN)
