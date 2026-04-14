from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, AuditMixin

if TYPE_CHECKING:
    from .user import User
    from .menu_item_extra import MenuItem
    from .order import Order
    from .branch import Branch


class RestaurantTable(Base, AuditMixin):
    __tablename__ = "tables"

    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"))
    num_chairs: Mapped[int]
    is_available: Mapped[bool] = mapped_column(default=True)

    branch: Mapped["Branch"] = relationship(back_populates="tables")
    orders: Mapped[list["Order"]] = relationship(back_populates="table")
