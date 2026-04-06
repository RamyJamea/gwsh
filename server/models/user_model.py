from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from ..core.enums import RoleEnum
from .base_model import Base, AuditMixin

if TYPE_CHECKING:
    from .branch_model import Branch
    from .history_model import OrderHistory
    from .order_model import Order


class User(Base, AuditMixin):
    __tablename__ = "users"

    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"))
    username: Mapped[str]
    role: Mapped[RoleEnum] = mapped_column(default=RoleEnum.CASHIER)
    hashed_password: Mapped[str]
    is_active: Mapped[bool] = mapped_column(default=True)

    branch: Mapped["Branch"] = relationship(back_populates="users")
    order_histories: Mapped[list["OrderHistory"]] = relationship(
        back_populates="cashier"
    )
    orders: Mapped[list["Order"]] = relationship(back_populates="cashier")
