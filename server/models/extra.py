from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from .base import Base, AuditMixin, ORPHAN
from ..helpers.enums import TableEnum

if TYPE_CHECKING:
    from .menu_item_extra import MenuItemExtraModel


class ExtraModel(Base, AuditMixin):
    __tablename__ = TableEnum.EXTRAS.value

    name: Mapped[str] = mapped_column(String(255), index=True, unique=True)

    menu_items_extras: Mapped[list["MenuItemExtraModel"]] = relationship(
        back_populates="extra", cascade=ORPHAN, passive_deletes=True
    )
