from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi.exceptions import HTTPException
from ..core.enums import ActionEnum, PaymentEnum
from ..core.schemas import OrderCreate, OrderUpdate, OrderItemCreate
from ..models import Order, OrderHistory
from ..repositories import *
from .base_service import BaseService
from .history_service import OrderHistoryService


class OrderService(BaseService):
    def __init__(self, session: Session):
        super().__init__(session, OrderRepository(session))
        self.order_item_repo = OrderItemRepository(session)
        self.order_item_extra_repo = OrderItemExtraRepository(session)
        self.user_repo = UserRepository(session)
        self.branch_repo = BranchRepository(session)
        self.table_repo = RestaurantTableRepository(session)
        self.menu_item_repo = MenuItemRepository(session)
        self.menu_item_extra_repo = MenuItemExtraRepository(session)
        self.history_service = OrderHistoryService(session)

    def _validate_items(self, items: list[OrderItemCreate]) -> None:
        if not items:
            return

        menu_item_ids = {item.menu_item_id for item in items}
        extra_ids = {
            extra.menu_item_extra_id for item in items for extra in item.extras
        }

        if menu_item_ids:
            valid_menu_items = self.menu_item_repo.get_by_ids(list(menu_item_ids))
            if len(valid_menu_items) != len(menu_item_ids):
                raise ValueError("One or more menu items do not exist")

        if extra_ids:
            valid_extras = self.menu_item_extra_repo.get_by_ids(list(extra_ids))
            if len(valid_extras) != len(extra_ids):
                raise ValueError("One or more menu item extras do not exist")

    def _create_order_items(self, order_id: int, items: list[OrderItemCreate]) -> None:
        for item in items:
            order_item = self.order_item_repo.create(
                {
                    "order_id": order_id,
                    "menu_item_id": item.menu_item_id,
                    "quantity": item.quantity,
                    "price_at_time": item.price_at_time,
                }
            )

            for extra in item.extras:
                self.order_item_extra_repo.create(
                    {
                        "order_item_id": order_item.id,
                        "menu_item_extra_id": extra.menu_item_extra_id,
                        "quantity": extra.quantity,
                        "price_at_time": extra.price_at_time,
                    }
                )

    def _validate_order_not_finalized(self, order: Order) -> None:
        if order.action in (ActionEnum.PAY, ActionEnum.CANCEL):
            raise HTTPException(
                status_code=400,
                detail="Cannot modify a paid or canceled order",
            )

    def _recalculate_order_total(self, order: Order) -> Decimal:
        total = Decimal("0.00")
        for item in order.order_items:
            total += item.price_at_time * item.quantity
            for extra in item.order_item_extras:
                total += extra.price_at_time * extra.quantity
        return total

    def _release_table_if_occupied(self, order: Order) -> None:
        if order.table_id:
            table = self.table_repo.get_by_id(order.table_id)
            if table:
                table.is_available = True

    def _handle_table_availability(
        self, order: Order, new_table_id: int | None
    ) -> None:
        if order.table_id and order.table_id != new_table_id:
            old_table = self.table_repo.get_by_id(order.table_id)
            if old_table:
                old_table.is_available = True

        if new_table_id is not None and new_table_id != order.table_id:
            new_table = self.table_repo.get_by_id(new_table_id)
            if not new_table:
                raise ValueError("Table not found")
            new_table.is_available = False

    def create(self, data: OrderCreate) -> Order:
        if not self.user_repo.get_by_id(data.cashier_id):
            raise ValueError("Cashier not found")
        if not self.branch_repo.get_by_id(data.branch_id):
            raise ValueError("Branch not found")

        table = None
        if data.table_id is not None:
            table = self.table_repo.get_by_id(data.table_id)
            if not table:
                raise ValueError("Table not found")

        self._validate_items(data.items)

        order = self.repo.create(
            {
                "cashier_id": data.cashier_id,
                "branch_id": data.branch_id,
                "table_id": data.table_id,
                "total_amount": data.total_amount,
                "action": data.action,
                "payment_method": data.payment_method,
            }
        )

        self._create_order_items(order.id, data.items)

        order = self.repo.get_order_with_details(order.id)
        self.history_service.create_snapshot(order, data.cashier_id, data.action)

        if table is not None:
            table.is_available = False

        self.session.commit()
        return order

    def add_items(
        self, order_id: int, items_in: list[OrderItemCreate], cashier_id: int
    ) -> Order:
        order = self.repo.get_order_with_details(order_id)
        self._validate_order_not_finalized(order)

        self._validate_items(items_in)
        self._create_order_items(order.id, items_in)

        self.session.flush()
        
        self.session.expire_all()
        order = self.repo.get_order_with_details(order_id)
        order.total_amount = self._recalculate_order_total(order)

        self.history_service.create_snapshot(order, cashier_id, ActionEnum.UPDATE)
        self.session.commit()
        return order

    def update(self, order_id: int, data: OrderUpdate, cashier_id: int) -> Order:
        obj = self.get(order_id)

        update_payload = data.model_dump(exclude_unset=True)
        if not update_payload:
            return obj

        if "action" in update_payload:
            raise HTTPException(
                status_code=400,
                detail="Use explicit endpoints (/checkout, /cancel) for state changes",
            )

        self.repo.update(obj, update_payload)

        order = self.repo.get_order_with_details(order_id)
        self.history_service.create_snapshot(order, cashier_id, ActionEnum.UPDATE)

        self.session.commit()
        return order

    def checkout(
        self, order_id: int, cashier_id: int, payment_method: PaymentEnum
    ) -> Order:
        order = self.get(order_id)
        self._validate_order_not_finalized(order)

        if order.action == ActionEnum.PAY:
            raise HTTPException(status_code=400, detail="Order is already paid")

        self.repo.update(
            order,
            {"action": ActionEnum.PAY, "payment_method": payment_method},
        )

        order = self.repo.get_order_with_details(order_id)
        self.history_service.create_snapshot(order, cashier_id, ActionEnum.PAY)
        self._release_table_if_occupied(order)

        self.session.commit()
        return order

    def cancel(
        self, order_id: int, cashier_id: int, reason: str | None = None
    ) -> Order:
        order = self.get(order_id)
        self._validate_order_not_finalized(order)

        if order.action == ActionEnum.PAY:
            raise HTTPException(status_code=400, detail="Cannot cancel a paid order")

        self.repo.update(order, {"action": ActionEnum.CANCEL})

        order = self.repo.get_order_with_details(order_id)
        self.history_service.create_snapshot(order, cashier_id, ActionEnum.CANCEL)
        self._release_table_if_occupied(order)

        self.session.commit()
        return order

    def delete_order(self, order_id: int) -> dict:
        order = self.repo.get_by_id(order_id)
        if not order:
            raise ValueError(f"Order {order_id} not found")
        
        self.session.delete(order)
        self.session.commit()
        return {"message": f"Successfully deleted order {order_id}."}

    def get_detail(self, order_id: int) -> Order:
        order = self.repo.get_order_with_details(order_id)
        if not order:
            raise ValueError(f"Order {order_id} not found")
        return order

    def list_by_branch(
        self, branch_id: int, skip: int = 0, limit: int = 100
    ) -> Sequence[Order]:
        return self.repo.get_orders_by_branch(branch_id, skip, limit)

    def get_order_history(self, order_id: int) -> Sequence[OrderHistory]:
        return self.history_service.get_history_for_order(order_id)

    def get_history_detail(self, history_id: int) -> OrderHistory:
        return self.history_service.get_history_detail(history_id)

    def update_item_quantity(
        self, order_id: int, order_item_id: int, quantity: int, cashier_id: int
    ) -> Order:
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be > 0")

        order = self.repo.get_order_with_details(order_id)
        self._validate_order_not_finalized(order)

        item = next((i for i in order.order_items if i.id == order_item_id), None)
        if not item:
            raise HTTPException(status_code=404, detail="Order item not found")

        item.quantity = quantity
        self.session.flush()
        
        self.session.expire_all()
        order = self.repo.get_order_with_details(order_id)
        order.total_amount = self._recalculate_order_total(order)

        self.history_service.create_snapshot(order, cashier_id, ActionEnum.UPDATE)
        self.session.commit()
        return order

    def remove_item(self, order_id: int, order_item_id: int, cashier_id: int) -> Order:
        order = self.repo.get_order_with_details(order_id)
        self._validate_order_not_finalized(order)

        item = next((i for i in order.order_items if i.id == order_item_id), None)
        if not item:
            raise HTTPException(status_code=404, detail="Order item not found")

        self.order_item_repo.delete(order_item_id)
        self.session.flush()

        self.session.expire_all()
        order = self.repo.get_order_with_details(order_id)
        order.total_amount = self._recalculate_order_total(order)

        self.history_service.create_snapshot(order, cashier_id, ActionEnum.UPDATE)
        self.session.commit()
        return order

    def update_table(
        self, order_id: int, table_id: int | None, cashier_id: int
    ) -> Order:
        order = self.repo.get_order_with_details(order_id)
        self._validate_order_not_finalized(order)

        if order.table_id == table_id:
            return order

        self._handle_table_availability(order, table_id)
        order.table_id = table_id

        self.history_service.create_snapshot(order, cashier_id, ActionEnum.UPDATE)
        self.session.commit()
        return order

    def export_detailed_history_to_excel(self, order_id: int) -> bytes:
        """Public API for exporting detailed order history as Excel."""
        return self.history_service.export_detailed_history_to_excel(order_id)

    def export_detailed_history_for_branch(self, branch_id: int) -> bytes:
        """Public API for exporting detailed history of ALL orders in a branch as Excel."""
        return self.history_service.export_detailed_history_for_branch(branch_id)

    def clear_branch_history(self, branch_id: int) -> int:
        from sqlalchemy import select
        if not self.branch_repo.get_by_id(branch_id):
            raise ValueError(f"Branch {branch_id} not found")

        stmt = select(Order).where(
            Order.branch_id == branch_id,
            Order.action.in_([ActionEnum.PAY, ActionEnum.CANCEL])
        )
        orders_to_delete = self.session.scalars(stmt).all()
        count = len(orders_to_delete)

        for order in orders_to_delete:
            self.session.delete(order)

        self.session.commit()
        return count
