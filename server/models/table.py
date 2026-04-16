from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, AuditMixin
from ..helpers.enums import TableEnum

if TYPE_CHECKING:
    from .branch import BranchModel
    from .order import OrderModel


class TableModel(Base, AuditMixin):
    __tablename__ = TableEnum.TABLES.value

    branch_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.BRANCHES.value}.id", ondelete="CASCADE"))
    num_chairs: Mapped[int] = mapped_column(default=0)
    is_available: Mapped[bool] = mapped_column(default=True)

    branch: Mapped["BranchModel"] = relationship(back_populates="tables")
    orders: Mapped[list["OrderModel"]] = relationship(back_populates="table")
