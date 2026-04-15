from typing import TYPE_CHECKING
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, AuditMixin, ORPHAN
from ..core.enums import TableEnum

if TYPE_CHECKING:
    from .user import UserModel
    from .menu_item_extra import MenuItemModel
    from .order import OrderModel
    from .table import TableModel


class BranchModel(Base, AuditMixin):
    __tablename__ = TableEnum.BRANCHES.value

    name: Mapped[str] = mapped_column(String(255) ,unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(default=True)

    tables: Mapped[list["TableModel"]] = relationship(back_populates="branch", cascade=ORPHAN)
    users: Mapped[list["UserModel"]] = relationship(back_populates="branch", cascade=ORPHAN)
    menu_items: Mapped[list["MenuItemModel"]] = relationship(back_populates="branch", cascade=ORPHAN)
    orders: Mapped[list["OrderModel"]] = relationship(back_populates="branch")
