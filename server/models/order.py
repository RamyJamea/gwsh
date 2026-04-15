from typing import TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.enums import ActionEnum, PaymentEnum, TableEnum
from .base import Base, AuditMixin, ORPHAN

if TYPE_CHECKING:
    from .branch import BranchModel, TableModel
    from .user import UserModel
    from .history import OrderHistoryModel
    from .order_item import OrderItemModel


class OrderModel(Base, AuditMixin):
    __tablename__ = TableEnum.ORDERS.value

    cashier_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.USERS.value}.id"), index=True)
    branch_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.BRANCHES.value}.id"), index=True)
    table_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.TABLES.value}.id"), nullable=True, index=True)
    
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    action: Mapped[ActionEnum] = mapped_column(default=ActionEnum.CREATE)
    payment_method: Mapped[PaymentEnum] = mapped_column(default=PaymentEnum.CASH)

    cashier: Mapped["UserModel"] = relationship(back_populates="orders")
    branch: Mapped["BranchModel"] = relationship(back_populates="orders")
    table: Mapped["TableModel"] = relationship(back_populates="orders")
    orders_items: Mapped[list["OrderItemModel"]] = relationship(
        back_populates="order", cascade=ORPHAN, passive_deletes=True
    )
    orders_histories: Mapped[list["OrderHistoryModel"]] = relationship(
        back_populates="order", cascade=ORPHAN, passive_deletes=True
    )
