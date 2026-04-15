from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, AuditMixin, ORPHAN
from ..core.enums import TableEnum

if TYPE_CHECKING:
    from .user import UserModel
    from .menu_item_extra import MenuItem
    from .order import Order
    from .table import TableModel


class BranchModel(Base, AuditMixin):
    __tablename__ = TableEnum.BRANCHES.value

    name: Mapped[str] = mapped_column(unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(default=True)

    tables: Mapped[list["TableModel"]] = relationship(back_populates="branch", cascade=ORPHAN)
    users: Mapped[list["UserModel"]] = relationship(back_populates="branch", cascade=ORPHAN)
    menu_items: Mapped[list["MenuItem"]] = relationship(back_populates="branch", cascade=ORPHAN)
    orders: Mapped[list["Order"]] = relationship(back_populates="branch")
