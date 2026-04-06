from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base_model import Base, AuditMixin
from .user_model import User
from .menu_model import MenuItem
from .order_model import Order


class Branch(Base, AuditMixin):
    __tablename__ = "branches"

    name: Mapped[str]

    tables: Mapped[list["RestaurantTable"]] = relationship(
        back_populates="branch", cascade="all, delete-orphan"
    )
    users: Mapped[list["User"]] = relationship(back_populates="branch")
    menu_items: Mapped[list["MenuItem"]] = relationship(back_populates="branch")
    orders: Mapped[list["Order"]] = relationship(back_populates="branch")


class RestaurantTable(Base, AuditMixin):
    __tablename__ = "tables"

    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"))
    num_chairs: Mapped[int]
    is_available: Mapped[bool] = mapped_column(default=True)

    branch: Mapped["Branch"] = relationship(back_populates="tables")
    orders: Mapped[list["Order"]] = relationship(back_populates="table")
