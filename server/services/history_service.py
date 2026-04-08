import pandas as pd
from typing import Sequence
from io import BytesIO
from sqlalchemy.orm import Session
from ..core.enums import ActionEnum
from ..models import Order, OrderHistory
from ..repositories import *
from .base_service import BaseService


class OrderHistoryService(BaseService):
    def __init__(self, session: Session):
        super().__init__(session, OrderHistoryRepository(session))
        self.history_item_repo = OrderHistoryItemRepository(session)
        self.history_item_extra_repo = OrderHistoryItemExtraRepository(session)
        # Added for branch-wide export
        self.order_repo = OrderRepository(session)
        self.branch_repo = BranchRepository(session)

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

    def export_detailed_history_to_excel(self, order_id: int) -> bytes:
        """Generate a detailed Excel export of the full order history (all snapshots)."""
        # Fetch all history entries for the order
        histories: Sequence[OrderHistory] = self.get_history_for_order(order_id)
        if not histories:
            raise ValueError(f"No history found for order {order_id}")

        # Force full details (items + extras + names) by calling get_history_detail
        # (This is safe because history per order is usually very small)
        detailed_histories = [self.get_history_detail(h.id) for h in histories]

        # ── Sheet 1: History Summary ─────────────────────────────────────
        summary_data = []
        for h in detailed_histories:
            summary_data.append(
                {
                    "History ID": h.id,
                    "Timestamp": h.timestamp,
                    "Action": (
                        h.action.value if hasattr(h.action, "value") else str(h.action)
                    ),
                    "Cashier": (
                        h.cashier.username if getattr(h, "cashier", None) else "N/A"
                    ),
                    "Total Amount": float(h.total_amount_at_time or 0),
                }
            )
        summary_df = pd.DataFrame(summary_data)

        # ── Sheet 2: Detailed Items & Extras (flattened, one row per item/extra) ──
        items_data = []
        for h in detailed_histories:
            hist_meta = {
                "History ID": h.id,
                "Timestamp": h.timestamp,
                "Action": (
                    h.action.value if hasattr(h.action, "value") else str(h.action)
                ),
                "Cashier": h.cashier.username if getattr(h, "cashier", None) else "N/A",
                "Total Amount": float(h.total_amount_at_time or 0),
            }

            for item in h.order_history_items:
                # Build readable menu item name (product + size)
                if (
                    getattr(item, "menu_item", None)
                    and getattr(item.menu_item, "product", None)
                    and getattr(item.menu_item, "size", None)
                ):
                    item_name = (
                        f"{item.menu_item.product.name} ({item.menu_item.size.name})"
                    )
                else:
                    item_name = f"MenuItem #{item.menu_item_id}"

                # Main item row
                row = hist_meta.copy()
                row.update(
                    {
                        "Type": "Item",
                        "Item / Extra": item_name,
                        "Quantity": item.quantity,
                        "Price at Time": float(item.price_at_time or 0),
                        "Subtotal": float(item.price_at_time or 0) * item.quantity,
                    }
                )
                items_data.append(row)

                # Extra rows (indented for visual hierarchy)
                for extra in item.order_item_extras:
                    if getattr(extra, "menu_item_extra", None) and getattr(
                        extra.menu_item_extra, "extra", None
                    ):
                        extra_name = extra.menu_item_extra.extra.name
                    else:
                        extra_name = f"Extra #{extra.menu_item_extra_id}"

                    extra_row = hist_meta.copy()
                    extra_row.update(
                        {
                            "Type": "Extra",
                            "Item / Extra": f"   └─ {extra_name}",
                            "Quantity": extra.quantity,
                            "Price at Time": float(extra.price_at_time or 0),
                            "Subtotal": float(extra.price_at_time or 0)
                            * extra.quantity,
                        }
                    )
                    items_data.append(extra_row)

        items_df = pd.DataFrame(items_data)

        # ── Generate Excel file in memory ─────────────────────────────────
        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            summary_df.to_excel(writer, sheet_name="History Summary", index=False)
            items_df.to_excel(writer, sheet_name="Detailed Items & Extras", index=False)

            # Optional: auto-adjust column widths
            for sheet in writer.sheets.values():
                for column in sheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except Exception:
                            pass
                    adjusted_width = min(max_length + 2, 50)
                    sheet.column_dimensions[column_letter].width = adjusted_width

        output.seek(0)
        return output.getvalue()

    def export_detailed_history_for_branch(self, branch_id: int) -> bytes:
        """Generate a detailed Excel export of the FULL history of ALL orders in a branch.
        Contains 3 sheets:
          - Orders Overview (one row per order using its final snapshot)
          - History Summary (every snapshot across the branch)
          - Detailed Items & Extras (flattened with Order ID)
        """
        if not self.branch_repo.get_by_id(branch_id):
            raise ValueError(f"Branch {branch_id} not found")

        # ── Fetch ALL orders in the branch (handles pagination automatically) ──
        orders: list[Order] = []
        skip = 0
        limit = 200
        while True:
            batch = self.order_repo.get_orders_by_branch(branch_id, skip, limit)
            orders.extend(batch)
            if len(batch) < limit:
                break
            skip += limit

        if not orders:
            raise ValueError(f"No orders found for branch {branch_id}")

        # Load full detailed history for every order
        all_detailed_histories: list[OrderHistory] = []
        for order in orders:
            histories = self.get_history_for_order(order.id)
            if histories:
                detailed = [self.get_history_detail(h.id) for h in histories]
                all_detailed_histories.extend(detailed)

        if not all_detailed_histories:
            raise ValueError(f"No history found for branch {branch_id}")

        # ── Sheet 1: Orders Overview (final state of each order) ──
        orders_data = []
        for order in orders:
            order_histories = [
                h for h in all_detailed_histories if h.order_id == order.id
            ]
            if not order_histories:
                continue
            # Use the latest snapshot as the "final" state
            last_h = max(order_histories, key=lambda h: h.timestamp)
            orders_data.append(
                {
                    "Order ID": order.id,
                    "Table ID": order.table_id,
                    "Final Action": (
                        last_h.action.value
                        if hasattr(last_h.action, "value")
                        else str(last_h.action)
                    ),
                    "Final Timestamp": last_h.timestamp,
                    "Final Cashier": (
                        last_h.cashier.username
                        if getattr(last_h, "cashier", None)
                        else "N/A"
                    ),
                    "Final Total Amount": float(last_h.total_amount_at_time or 0),
                    "Number of Snapshots": len(order_histories),
                }
            )
        orders_df = pd.DataFrame(orders_data)

        # ── Sheet 2: History Summary (all snapshots with Order ID) ──
        summary_data = []
        for h in all_detailed_histories:
            summary_data.append(
                {
                    "Order ID": h.order_id,
                    "History ID": h.id,
                    "Timestamp": h.timestamp,
                    "Action": (
                        h.action.value if hasattr(h.action, "value") else str(h.action)
                    ),
                    "Cashier": (
                        h.cashier.username if getattr(h, "cashier", None) else "N/A"
                    ),
                    "Total Amount": float(h.total_amount_at_time or 0),
                }
            )
        summary_df = pd.DataFrame(summary_data)

        # ── Sheet 3: Detailed Items & Extras (flattened, one row per item/extra) ──
        items_data = []
        for h in all_detailed_histories:
            hist_meta = {
                "Order ID": h.order_id,
                "History ID": h.id,
                "Timestamp": h.timestamp,
                "Action": (
                    h.action.value if hasattr(h.action, "value") else str(h.action)
                ),
                "Cashier": h.cashier.username if getattr(h, "cashier", None) else "N/A",
                "Total Amount": float(h.total_amount_at_time or 0),
            }

            for item in h.order_history_items:
                # Build readable menu item name (product + size)
                if (
                    getattr(item, "menu_item", None)
                    and getattr(item.menu_item, "product", None)
                    and getattr(item.menu_item, "size", None)
                ):
                    item_name = (
                        f"{item.menu_item.product.name} ({item.menu_item.size.name})"
                    )
                else:
                    item_name = f"MenuItem #{item.menu_item_id}"

                # Main item row
                row = hist_meta.copy()
                row.update(
                    {
                        "Type": "Item",
                        "Item / Extra": item_name,
                        "Quantity": item.quantity,
                        "Price at Time": float(item.price_at_time or 0),
                        "Subtotal": float(item.price_at_time or 0) * item.quantity,
                    }
                )
                items_data.append(row)

                # Extra rows (indented for visual hierarchy)
                for extra in item.order_item_extras:
                    if getattr(extra, "menu_item_extra", None) and getattr(
                        extra.menu_item_extra, "extra", None
                    ):
                        extra_name = extra.menu_item_extra.extra.name
                    else:
                        extra_name = f"Extra #{extra.menu_item_extra_id}"

                    extra_row = hist_meta.copy()
                    extra_row.update(
                        {
                            "Type": "Extra",
                            "Item / Extra": f"   └─ {extra_name}",
                            "Quantity": extra.quantity,
                            "Price at Time": float(extra.price_at_time or 0),
                            "Subtotal": float(extra.price_at_time or 0)
                            * extra.quantity,
                        }
                    )
                    items_data.append(extra_row)

        items_df = pd.DataFrame(items_data)

        # ── Generate Excel file in memory ─────────────────────────────────
        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            orders_df.to_excel(writer, sheet_name="Orders Overview", index=False)
            summary_df.to_excel(writer, sheet_name="History Summary", index=False)
            items_df.to_excel(writer, sheet_name="Detailed Items & Extras", index=False)

            # Auto-adjust column widths for readability
            for sheet in writer.sheets.values():
                for column in sheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except Exception:
                            pass
                    adjusted_width = min(max_length + 2, 50)
                    sheet.column_dimensions[column_letter].width = adjusted_width

        output.seek(0)
        return output.getvalue()
