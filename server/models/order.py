from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..helpers.enums import ActionEnum, PaymentEnum, TableEnum
from .base import Base, AuditMixin, ORPHAN

if TYPE_CHECKING:
    from .branch import BranchModel, TableModel
    from .user import UserModel
    from .history import HistoryModel
    from .order_item import OrderItemModel


class OrderModel(Base, AuditMixin):
    __tablename__ = TableEnum.ORDERS.value

    cashier_id: Mapped[int] = mapped_column(
        ForeignKey(f"{TableEnum.USERS.value}.id", ondelete="SET NULL"), 
        index=True
    )
    branch_id: Mapped[int] = mapped_column(
        ForeignKey(f"{TableEnum.BRANCHES.value}.id", ondelete="RESTRICT"),
        index=True
    )
    table_id: Mapped[int | None] = mapped_column(
        ForeignKey(f"{TableEnum.TABLES.value}.id", ondelete="SET NULL"), 
        nullable=True, 
        index=True
    )
    destination: Mapped[str | None] = mapped_column(String(50), nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    action: Mapped[ActionEnum] = mapped_column("status", default=ActionEnum.CREATE)
    payment_method: Mapped[PaymentEnum | None] = mapped_column(nullable=True)

    cashier: Mapped["UserModel"] = relationship(back_populates="orders")
    branch: Mapped["BranchModel"] = relationship(back_populates="orders")
    table: Mapped["TableModel"] = relationship(back_populates="orders")
    order_items: Mapped[list["OrderItemModel"]] = relationship(
        back_populates="order", cascade=ORPHAN, passive_deletes=True
    )
    histories: Mapped[list["HistoryModel"]] = relationship(
        back_populates="order", cascade=ORPHAN, passive_deletes=True
    )
