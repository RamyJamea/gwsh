from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from ..core.enums import RoleEnum
from .base import Base, AuditMixin

if TYPE_CHECKING:
    from .branch import Branch
    from .history import OrderHistory
    from .order import Order


class User(Base, AuditMixin):
    __tablename__ = "users"

    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"))
    username: Mapped[str] = mapped_column(unique=True, index=True)
    role: Mapped[RoleEnum] = mapped_column(default=RoleEnum.CASHIER)
    hashed_password: Mapped[str]
    is_active: Mapped[bool] = mapped_column(default=True)

    branch: Mapped["Branch"] = relationship(back_populates="users")
    order_histories: Mapped[list["OrderHistory"]] = relationship(
        back_populates="cashier"
    )
    orders: Mapped[list["Order"]] = relationship(back_populates="cashier")
