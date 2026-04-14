from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, AuditMixin

if TYPE_CHECKING:
    from .user import User
    from .menu_item_extra import MenuItem
    from .order import Order
    from .table import RestaurantTable


class Branch(Base, AuditMixin):
    __tablename__ = "branches"

    name: Mapped[str] = mapped_column(unique=True, index=True)

    tables: Mapped[list["RestaurantTable"]] = relationship(
        back_populates="branch", cascade="all, delete-orphan"
    )
    users: Mapped[list["User"]] = relationship(
        back_populates="branch", cascade="all, delete-orphan"
    )
    menu_items: Mapped[list["MenuItem"]] = relationship(
        back_populates="branch", cascade="all, delete-orphan"
    )
    orders: Mapped[list["Order"]] = relationship(
        back_populates="branch", cascade="all, delete-orphan"
    )
