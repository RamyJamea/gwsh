from typing import TYPE_CHECKING
from datetime import datetime
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..helpers.enums import ActionEnum, TableEnum
from .base import Base, AuditMixin, ORPHAN

if TYPE_CHECKING:
    from .order import OrderModel
    from .user import UserModel
    from .history_item import HistoryItemModel


class HistoryModel(Base, AuditMixin):
    __tablename__ = TableEnum.HISTORIES.value

    order_id: Mapped[int] = mapped_column(ForeignKey(f"{TableEnum.ORDERS.value}.id", ondelete="CASCADE"), index=True)
    cashier_id: Mapped[int|None] = mapped_column(
        ForeignKey(f"{TableEnum.USERS.value}.id", ondelete="SET NULL"), nullable=True, index=True
    )

    action: Mapped[ActionEnum] = mapped_column(default=ActionEnum.CREATE)
    timestamp: Mapped[datetime] = mapped_column(server_default=func.now())
    total_amount_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    cashier: Mapped["UserModel"] = relationship(back_populates="histories")
    order: Mapped["OrderModel"] = relationship(back_populates="histories")
    history_items: Mapped[list["HistoryItemModel"]] = relationship(
        back_populates="history", cascade=ORPHAN, passive_deletes=True
    )
