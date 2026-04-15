from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String
from ..core.enums import RoleEnum, TableEnum
from .base import Base, AuditMixin

if TYPE_CHECKING:
    from .branch import BranchModel
    from .history import OrderHistoryModel
    from .order import OrderModel


class UserModel(Base, AuditMixin):
    __tablename__ = TableEnum.USERS.value

    branch_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.BRANCHES.value}.id"))
    username: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255),unique=True, index=True)
    role: Mapped[RoleEnum] = mapped_column(default=RoleEnum.CASHIER)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)

    branch: Mapped["BranchModel"] = relationship(back_populates="users")
    orders: Mapped[list["OrderModel"]] = relationship(back_populates="cashier")
    order_histories: Mapped[list["OrderHistoryModel"]] = relationship(back_populates="cashier")
