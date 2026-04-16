from typing import Sequence
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from .base import BaseRepository
from ..models import Order, OrderItem, OrderItemExtra


class OrderRepository(BaseRepository[Order]):
    def __init__(self, session: Session):
        super().__init__(session, Order)

    def get_order_with_details(self, order_id: int) -> Order | None:
        stmt = (
            select(Order)
            .options(
                selectinload(Order.order_items).options(
                    selectinload(OrderItem.order_item_extras),
                    selectinload(OrderItem.menu_item),
                ),
                selectinload(Order.cashier),
                selectinload(Order.branch),
                selectinload(Order.table),
            )
            .where(Order.id == order_id)
        )
        return self.session.scalars(stmt).first()

    def get_orders_by_branch(
        self, branch_id: int, skip: int = 0, limit: int = 100
    ) -> Sequence[Order]:
        stmt = (
            select(Order)
            .where(Order.branch_id == branch_id)
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return self.session.scalars(stmt).all()


class OrderItemRepository(BaseRepository[OrderItem]):
    def __init__(self, session: Session):
        super().__init__(session, OrderItem)

    def get_order_items_with_extras(self, order_id: int) -> Sequence[OrderItem]:
        stmt = (
            select(OrderItem)
            .options(
                selectinload(OrderItem.order_item_extras),
                selectinload(OrderItem.menu_item),
            )
            .where(OrderItem.order_id == order_id)
        )
        return self.session.scalars(stmt).all()


class OrderItemExtraRepository(BaseRepository[OrderItemExtra]):
    def __init__(self, session: Session):
        super().__init__(session, OrderItemExtra)

    def get_extras_for_order_item(self, order_item_id: int) -> Sequence[OrderItemExtra]:
        stmt = select(OrderItemExtra).where(
            OrderItemExtra.order_item_id == order_item_id
        )
        return self.session.scalars(stmt).all()
