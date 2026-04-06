from typing import Sequence
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from .base_repository import BaseRepository
from ..models import OrderHistory, OrderHistoryItem, OrderHistoryItemExtra


class OrderHistoryRepository(BaseRepository[OrderHistory]):
    def __init__(self, session: Session):
        super().__init__(session, OrderHistory)

    def get_order_history_with_details(
        self, order_history_id: int
    ) -> OrderHistory | None:
        stmt = (
            select(OrderHistory)
            .options(
                selectinload(OrderHistory.order_history_items).selectinload(
                    OrderHistoryItem.order_item_extras
                ),
                selectinload(OrderHistory.cashier),
                selectinload(OrderHistory.order),
            )
            .where(OrderHistory.id == order_history_id)
        )
        return self.session.scalars(stmt).first()

    def get_history_for_order(self, order_id: int) -> Sequence[OrderHistory]:
        stmt = (
            select(OrderHistory)
            .options(
                selectinload(OrderHistory.order_history_items).selectinload(
                    OrderHistoryItem.order_item_extras
                ),
            )
            .where(OrderHistory.order_id == order_id)
            .order_by(OrderHistory.timestamp.desc())
        )
        return self.session.scalars(stmt).all()


class OrderHistoryItemRepository(BaseRepository[OrderHistoryItem]):
    def __init__(self, session: Session):
        super().__init__(session, OrderHistoryItem)

    def get_history_items_with_extras(
        self, order_history_id: int
    ) -> Sequence[OrderHistoryItem]:
        stmt = (
            select(OrderHistoryItem)
            .options(
                selectinload(OrderHistoryItem.order_item_extras),
            )
            .where(OrderHistoryItem.order_history_id == order_history_id)
        )
        return self.session.scalars(stmt).all()


class OrderHistoryItemExtraRepository(BaseRepository[OrderHistoryItemExtra]):
    def __init__(self, session: Session):
        super().__init__(session, OrderHistoryItemExtra)

    def get_extras_for_history_item(
        self, order_history_item_id: int
    ) -> Sequence[OrderHistoryItemExtra]:
        stmt = select(OrderHistoryItemExtra).where(
            OrderHistoryItemExtra.order_history_item_id == order_history_item_id
        )
        return self.session.scalars(stmt).all()
