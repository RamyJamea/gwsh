from sqlalchemy.orm import Session
from ..core.enums import ActionEnum
from ..core.schemas import OrderCreate, OrderUpdate
from ..models import Order
from ..repositories import *
from .base_service import BaseService


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

        self.history_repo = OrderHistoryRepository(session)
        self.history_item_repo = OrderHistoryItemRepository(session)
        self.history_item_extra_repo = OrderHistoryItemExtraRepository(session)

    def create(self, data: OrderCreate) -> Order:
        # 1. Validate top-level references
        if not self.user_repo.get_by_id(data.cashier_id):
            raise ValueError("Cashier not found")
        if not self.branch_repo.get_by_id(data.branch_id):
            raise ValueError("Branch not found")

        table = None
        if data.table_id is not None:
            table = self.table_repo.get_by_id(data.table_id)
            if not table:
                raise ValueError("Table not found")

        # 2. Batch-validate all menu items & extras (fast fail + no N+1 queries)
        menu_item_ids = {item.menu_item_id for item in data.items}
        extra_ids = {
            extra.menu_item_extra_id for item in data.items for extra in item.extras
        }

        if menu_item_ids:
            valid_menu_items = self.menu_item_repo.get_by_ids(list(menu_item_ids))
            if len(valid_menu_items) != len(menu_item_ids):
                raise ValueError("One or more menu items do not exist")

        if extra_ids:
            valid_extras = self.menu_item_extra_repo.get_by_ids(list(extra_ids))
            if len(valid_extras) != len(extra_ids):
                raise ValueError("One or more menu item extras do not exist")

        # 3. Create live order (flushed by BaseRepository)
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

        # 4. Create live items + extras
        for item in data.items:
            order_item = self.order_item_repo.create(
                {
                    "order_id": order.id,
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

        # 5. Create complete history snapshot (centralized logic)
        self._create_history_snapshot(order.id, data.cashier_id, data.action)

        # 6. Mark table unavailable (if applicable)
        if table is not None:
            table.is_available = False

        self.session.commit()
        return order

    def update(self, order_id: int, data: OrderUpdate, cashier_id: int) -> Order:
        obj = self.get(order_id)

        update_payload = data.model_dump(exclude_unset=True)
        action_for_history = update_payload.get("action") or ActionEnum.UPDATE

        if update_payload:
            self.repo.update(obj, update_payload)

        self._create_history_snapshot(order_id, cashier_id, action_for_history)

        self.session.commit()
        return obj

    def _create_history_snapshot(
        self, order_id: int, cashier_id: int, action: ActionEnum
    ) -> None:
        # Load fully-hydrated order (includes items + extras)
        order = self.repo.get_order_with_details(order_id)
        if not order:
            raise ValueError(f"Order {order_id} not found")

        # Top-level history entry
        history = self.history_repo.create(
            {
                "order_id": order.id,
                "cashier_id": cashier_id,
                "action": action,
                "total_amount_at_time": order.total_amount,
            }
        )

        # Nested items + extras (exact mirror of live data)
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

    def get_detail(self, order_id: int) -> Order:
        order = self.repo.get_order_with_details(order_id)
        if not order:
            raise ValueError(f"Order {order_id} not found")
        return order

    def list_by_branch(
        self, branch_id: int, skip: int = 0, limit: int = 100
    ) -> Sequence[Order]:
        """List orders for a branch (used by list endpoint)."""
        return self.repo.get_orders_by_branch(branch_id, skip, limit)

    def get_order_history(self, order_id: int) -> Sequence[OrderHistory]:
        """Get full history (all snapshots) for an order."""
        return self.history_repo.get_history_for_order(order_id)

    def get_history_detail(self, history_id: int) -> OrderHistory:
        """Get a single history snapshot with all nested data."""
        history = self.history_repo.get_order_history_with_details(history_id)
        if not history:
            raise ValueError(f"History entry {history_id} not found")
        return history
