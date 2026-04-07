from typing import Sequence
from sqlalchemy.orm import Session
from ..core.enums import ActionEnum
from ..models import Order, OrderHistory
from ..repositories import *
from ..models import Order, OrderHistory
from .base_service import BaseService


class OrderHistoryService(BaseService):
    def __init__(self, session: Session):
        super().__init__(session, OrderHistoryRepository(session))
        self.history_item_repo = OrderHistoryItemRepository(session)
        self.history_item_extra_repo = OrderHistoryItemExtraRepository(session)

    def create_snapshot(
        self, order: Order, cashier_id: int, action: ActionEnum
    ) -> None:
        history = self.repo.create(
            {
                "order_id": order.id,
                "cashier_id": cashier_id,
                "action": action,
                "total_amount_at_time": order.total_amount,
            }
        )

        for order_item in order.order_items:
            history_item = self.history_item_repo.create(
                {
                    "order_history_id": history.id,
                    "menu_item_id": order_item.menu_item_id,
                    "quantity": order_item.quantity,
                    "price_at_time": order_item.price_at_time,
                }
            )

            for order_item_extra in order_item.order_item_extras:
                self.history_item_extra_repo.create(
                    {
                        "order_history_item_id": history_item.id,
                        "menu_item_extra_id": order_item_extra.menu_item_extra_id,
                        "quantity": order_item_extra.quantity,
                        "price_at_time": order_item_extra.price_at_time,
                    }
                )

    def get_history_for_order(self, order_id: int) -> Sequence[OrderHistory]:
        return self.repo.get_history_for_order(order_id)

    def get_history_detail(self, history_id: int) -> OrderHistory:
        history = self.repo.get_order_history_with_details(history_id)
        if not history:
            raise ValueError(f"History entry {history_id} not found")
        return history
