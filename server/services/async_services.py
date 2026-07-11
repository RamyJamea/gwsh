from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Sequence
from datetime import timedelta
from io import BytesIO
import pandas as pd
from ..helpers.enums import TableEnum, ActionEnum, PaymentEnum
from ..helpers.schemas.branch_schema import BranchCreate, BranchUpdate, TableCreate, TableUpdate
from ..helpers.schemas.menu_schema import MenuItemCreate, MenuItemUpdate
from ..helpers.schemas.order_schema import (
    OrderCreate, OrderUpdate, OrderItemCreate, OrderCheckout, OrderCancel, 
    OrderItemsAdd, OrderItemQuantityUpdate, OrderTableUpdate
)
from ..models import (
    BranchModel, TableModel, MenuItemModel, MenuItemExtraModel,
    OrderModel, OrderItemModel, OrderItemExtraModel, HistoryModel,
    HistoryItemModel, HistoryItemExtraModel, ProductModel, SizeModel, ExtraModel, CategoryModel
)
from ..repositories import BranchRepository, UserRepository
from ..repositories.catalog import ExtraRepository, SizeRepository, ProductRepository, CategoryRepository
from ..helpers.exceptions import NotFoundException
from .base import BaseCatalog
import structlog


class BranchService(BaseCatalog[BranchModel, BranchCreate, BranchUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session=session, repository=BranchRepository(session), model_name="branch")


class TableRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_one(self, id: int) -> TableModel | None:
        result = await self.session.execute(select(TableModel).where(TableModel.id == id))
        return result.scalar_one_or_none()

    async def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> Sequence[TableModel]:
        result = await self.session.execute(
            select(TableModel).where(TableModel.branch_id == branch_id).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def get_available_by_branch(self, branch_id: int) -> Sequence[TableModel]:
        result = await self.session.execute(
            select(TableModel).where(TableModel.branch_id == branch_id, TableModel.is_available == True)
        )
        return result.scalars().all()

    async def create(self, data: dict) -> TableModel:
        obj = TableModel(**data)
        self.session.add(obj)
        await self.session.flush()
        return obj

    async def update(self, obj: TableModel, data: dict) -> TableModel:
        for k, v in data.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        await self.session.flush()
        return obj

    async def delete(self, obj: TableModel) -> None:
        await self.session.delete(obj)
        await self.session.flush()


class TableService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = TableRepository(session)
        self.branch_repo = BranchRepository(session)
        self.logger = structlog.get_logger("TableService")

    async def get_tables_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> Sequence[TableModel]:
        return await self.repo.get_by_branch(branch_id, skip, limit)

    async def get_available_tables_by_branch(self, branch_id: int) -> Sequence[TableModel]:
        return await self.repo.get_available_by_branch(branch_id)

    async def get(self, table_id: int) -> TableModel:
        obj = await self.repo.get_one(table_id)
        if not obj:
            raise NotFoundException(f"Table {table_id} not found")
        return obj

    async def create(self, data: TableCreate) -> TableModel:
        branch = await self.branch_repo.get_one(data.branch_id)
        if not branch:
            raise NotFoundException(f"Branch {data.branch_id} not found")
        obj = await self.repo.create(data.model_dump())
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def update(self, table_id: int, data: TableUpdate) -> TableModel:
        obj = await self.get(table_id)
        updated = await self.repo.update(obj, data.model_dump(exclude_unset=True))
        await self.session.commit()
        await self.session.refresh(updated)
        return updated

    async def delete(self, table_id: int) -> None:
        obj = await self.get(table_id)
        await self.repo.delete(obj)
        await self.session.commit()


class MenuItemRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_one(self, id: int) -> MenuItemModel | None:
        from sqlalchemy.orm import selectinload
        result = await self.session.execute(
            select(MenuItemModel)
            .options(
                selectinload(MenuItemModel.product),
                selectinload(MenuItemModel.size),
                selectinload(MenuItemModel.menu_items_extras).selectinload(MenuItemExtraModel.extra),
            )
            .where(MenuItemModel.id == id)
        )
        return result.scalar_one_or_none()

    async def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> Sequence[MenuItemModel]:
        from sqlalchemy.orm import selectinload
        result = await self.session.execute(
            select(MenuItemModel)
            .options(
                selectinload(MenuItemModel.product),
                selectinload(MenuItemModel.size),
                selectinload(MenuItemModel.menu_items_extras).selectinload(MenuItemExtraModel.extra),
            )
            .where(MenuItemModel.branch_id == branch_id)
            .offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[MenuItemModel]:
        from sqlalchemy.orm import selectinload
        result = await self.session.execute(
            select(MenuItemModel)
            .options(
                selectinload(MenuItemModel.product),
                selectinload(MenuItemModel.size),
                selectinload(MenuItemModel.menu_items_extras).selectinload(MenuItemExtraModel.extra),
            )
            .offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def create(self, data: dict) -> MenuItemModel:
        obj = MenuItemModel(**data)
        self.session.add(obj)
        await self.session.flush()
        return obj

    async def update(self, obj: MenuItemModel, data: dict) -> MenuItemModel:
        for k, v in data.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        await self.session.flush()
        return obj

    async def delete(self, obj: MenuItemModel) -> None:
        await self.session.delete(obj)
        await self.session.flush()


class MenuService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = MenuItemRepository(session)
        self.branch_repo = BranchRepository(session)
        self.product_repo = ProductRepository(session)
        self.extra_repo = ExtraRepository(session)
        self.logger = structlog.get_logger("MenuService")

    async def get(self, menu_item_id: int) -> MenuItemModel:
        obj = await self.repo.get_one(menu_item_id)
        if not obj:
            raise NotFoundException(f"MenuItem {menu_item_id} not found")
        return obj

    async def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> Sequence[MenuItemModel]:
        return await self.repo.get_by_branch(branch_id, skip, limit)

    async def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[MenuItemModel]:
        return await self.repo.get_all(skip, limit)

    async def create(self, data: MenuItemCreate) -> MenuItemModel:
        branch = await self.branch_repo.get_one(data.branch_id)
        if not branch:
            raise NotFoundException(f"Branch {data.branch_id} not found")
        product = await self.product_repo.get_one(data.product_id)
        if not product:
            raise NotFoundException(f"Product {data.product_id} not found")

        menu_item = await self.repo.create({
            "branch_id": data.branch_id,
            "product_id": data.product_id,
            "size_id": data.size_id,
            "price": data.price,
        })

        if data.extras:
            for extra_data in data.extras:
                extra_obj = MenuItemExtraModel(
                    menu_item_id=menu_item.id,
                    extra_id=extra_data.extra_id,
                    price=extra_data.price,
                )
                self.session.add(extra_obj)

        await self.session.commit()
        obj = await self.repo.get_one(menu_item.id)
        return obj

    async def update(self, menu_item_id: int, data: MenuItemUpdate) -> MenuItemModel:
        obj = await self.get(menu_item_id)
        update_data = data.model_dump(exclude_unset=True)

        if "extras" in update_data:
            extras_list = update_data.pop("extras")
            await self.session.execute(
                delete(MenuItemExtraModel).where(MenuItemExtraModel.menu_item_id == menu_item_id)
            )
            if extras_list:
                for extra_data in extras_list:
                    extra_obj = MenuItemExtraModel(
                        menu_item_id=menu_item_id,
                        extra_id=extra_data["extra_id"],
                        price=extra_data["price"],
                    )
                    self.session.add(extra_obj)

        if update_data:
            await self.repo.update(obj, update_data)

        await self.session.commit()
        return await self.repo.get_one(menu_item_id)

    async def delete(self, menu_item_id: int) -> None:
        obj = await self.get(menu_item_id)
        await self.repo.delete(obj)
        await self.session.commit()


class OrderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_one(self, id: int) -> OrderModel | None:
        from sqlalchemy.orm import selectinload
        result = await self.session.execute(
            select(OrderModel)
            .options(
                selectinload(OrderModel.order_items).selectinload(OrderItemModel.order_item_extras).selectinload(OrderItemExtraModel.menu_item_extra).selectinload(MenuItemExtraModel.extra),
                selectinload(OrderModel.order_items).selectinload(OrderItemModel.menu_item).selectinload(MenuItemModel.product),
                selectinload(OrderModel.order_items).selectinload(OrderItemModel.menu_item).selectinload(MenuItemModel.size),
                selectinload(OrderModel.cashier),
                selectinload(OrderModel.branch),
                selectinload(OrderModel.table),
            )
            .where(OrderModel.id == id)
        )
        return result.scalar_one_or_none()

    async def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 500) -> Sequence[OrderModel]:
        from sqlalchemy.orm import selectinload
        result = await self.session.execute(
            select(OrderModel)
            .options(
                selectinload(OrderModel.order_items).selectinload(OrderItemModel.order_item_extras),
                selectinload(OrderModel.cashier),
                selectinload(OrderModel.table),
            )
            .where(OrderModel.branch_id == branch_id)
            .order_by(OrderModel.created_at.desc())
            .offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def create(self, data: dict) -> OrderModel:
        obj = OrderModel(**data)
        self.session.add(obj)
        await self.session.flush()
        return obj

    async def update(self, obj: OrderModel, data: dict) -> OrderModel:
        for k, v in data.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        await self.session.flush()
        return obj


class OrderHistoryService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_snapshot(
        self, order: OrderModel, cashier_id: int, action: ActionEnum
    ) -> None:
        history = HistoryModel(
            order_id=order.id,
            cashier_id=cashier_id,
            action=action,
            total_amount_at_time=order.total_amount,
        )
        self.session.add(history)
        await self.session.flush()

        for order_item in order.order_items:
            p_name = "Deleted Product"
            s_name = "Deleted Size"
            if order_item.menu_item:
                if order_item.menu_item.product:
                    p_name = order_item.menu_item.product.name
                if order_item.menu_item.size:
                    s_name = order_item.menu_item.size.name

            menu_item_name_str = f"{p_name} ({s_name})"

            history_item = HistoryItemModel(
                history_id=history.id,
                menu_item_id=order_item.menu_item_id,
                quantity=order_item.quantity,
                price_at_time=order_item.price_at_time,
                product_name=p_name,
                size_name=s_name,
            )
            self.session.add(history_item)
            await self.session.flush()

            for order_item_extra in order_item.order_item_extras:
                extra_name_str = "Deleted Extra"
                if order_item_extra.menu_item_extra and order_item_extra.menu_item_extra.extra:
                    extra_name_str = order_item_extra.menu_item_extra.extra.name

                history_item_extra = HistoryItemExtraModel(
                    history_item_id=history_item.id,
                    menu_item_extra_id=order_item_extra.menu_item_extra_id,
                    quantity=order_item_extra.quantity,
                    price_at_time=order_item_extra.price_at_time,
                    extra_name=extra_name_str,
                )
                self.session.add(history_item_extra)

        await self.session.flush()

    async def get_history_for_order(self, order_id: int) -> Sequence[HistoryModel]:
        from sqlalchemy.orm import selectinload
        result = await self.session.execute(
            select(HistoryModel)
            .options(
                selectinload(HistoryModel.history_items).selectinload(HistoryItemModel.histories_items_extras),
                selectinload(HistoryModel.cashier),
            )
            .where(HistoryModel.order_id == order_id)
            .order_by(HistoryModel.timestamp.desc())
        )
        return result.scalars().all()

    async def get_history_detail(self, history_id: int) -> HistoryModel:
        from sqlalchemy.orm import selectinload
        result = await self.session.execute(
            select(HistoryModel)
            .options(
                selectinload(HistoryModel.history_items).selectinload(HistoryItemModel.histories_items_extras),
                selectinload(HistoryModel.cashier),
                selectinload(HistoryModel.order),
            )
            .where(HistoryModel.id == history_id)
        )
        obj = result.scalar_one_or_none()
        if not obj:
            raise NotFoundException(f"History entry {history_id} not found")
        return obj

    async def export_detailed_history_to_excel(self, order_id: int) -> bytes:
        histories = await self.get_history_for_order(order_id)
        if not histories:
            raise ValueError(f"No history found for order {order_id}")

        detailed_histories = []
        for h in histories:
            detailed_histories.append(await self.get_history_detail(h.id))

        summary_data = []
        for h in detailed_histories:
            summary_data.append(
                {
                    "History ID": h.id,
                    "Timestamp": (h.timestamp + timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S") if h.timestamp else "N/A",
                    "Action": h.action.value if hasattr(h.action, "value") else str(h.action),
                    "Cashier": h.cashier.username if h.cashier else "N/A",
                    "Total Amount": float(h.total_amount_at_time or 0),
                }
            )
        summary_df = pd.DataFrame(summary_data)

        items_data = []
        for h in detailed_histories:
            hist_meta = {
                "History ID": h.id,
                "Timestamp": (h.timestamp + timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S") if h.timestamp else "N/A",
                "Action": h.action.value if hasattr(h.action, "value") else str(h.action),
                "Cashier": h.cashier.username if h.cashier else "N/A",
                "Total Amount": float(h.total_amount_at_time or 0),
            }

            for item in h.history_items:
                item_name = f"{item.product_name} ({item.size_name})"
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

                for extra in item.histories_items_extras:
                    extra_row = hist_meta.copy()
                    extra_row.update(
                        {
                            "Type": "Extra",
                            "Item / Extra": f" └─ {extra.extra_name}",
                            "Quantity": extra.quantity,
                            "Price at Time": float(extra.price_at_time or 0),
                            "Subtotal": float(extra.price_at_time or 0) * extra.quantity,
                        }
                    )
                    items_data.append(extra_row)

        items_df = pd.DataFrame(items_data)

        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            summary_df.to_excel(writer, sheet_name="History Summary", index=False)
            items_df.to_excel(writer, sheet_name="Detailed Items & Extras", index=False)

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

    async def export_detailed_history_for_branch(self, branch_id: int) -> bytes:
        result = await self.session.execute(
            select(OrderModel).where(OrderModel.branch_id == branch_id)
        )
        orders = result.scalars().all()
        if not orders:
            raise ValueError(f"No orders found for branch {branch_id}")

        all_detailed_histories = []
        for order in orders:
            histories = await self.get_history_for_order(order.id)
            for h in histories:
                all_detailed_histories.append(await self.get_history_detail(h.id))

        if not all_detailed_histories:
            raise ValueError(f"No history found for branch {branch_id}")

        orders_data = []
        for order in orders:
            order_histories = [h for h in all_detailed_histories if h.order_id == order.id]
            if not order_histories:
                continue
            last_h = max(order_histories, key=lambda h: h.timestamp)
            orders_data.append(
                {
                    "Order ID": order.id,
                    "Table ID": order.table_id,
                    "Final Action": last_h.action.value if hasattr(last_h.action, "value") else str(last_h.action),
                    "Final Timestamp (TRT)": (last_h.timestamp + timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S") if last_h.timestamp else "N/A",
                    "Final Cashier": last_h.cashier.username if last_h.cashier else "N/A",
                    "Final Total Amount": float(last_h.total_amount_at_time or 0),
                    "Number of Snapshots": len(order_histories),
                }
            )
        orders_df = pd.DataFrame(orders_data)

        summary_data = []
        for h in all_detailed_histories:
            summary_data.append(
                {
                    "Order ID": h.order_id,
                    "History ID": h.id,
                    "Timestamp (TRT)": (h.timestamp + timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S") if h.timestamp else "N/A",
                    "Action": h.action.value if hasattr(h.action, "value") else str(h.action),
                    "Cashier": h.cashier.username if h.cashier else "N/A",
                    "Total Amount": float(h.total_amount_at_time or 0),
                }
            )
        summary_df = pd.DataFrame(summary_data)

        items_data = []
        for h in all_detailed_histories:
            hist_meta = {
                "Order ID": h.order_id,
                "History ID": h.id,
                "Timestamp (TRT)": (h.timestamp + timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S") if h.timestamp else "N/A",
                "Action": h.action.value if hasattr(h.action, "value") else str(h.action),
                "Cashier": h.cashier.username if h.cashier else "N/A",
                "Total Amount": float(h.total_amount_at_time or 0),
            }

            for item in h.history_items:
                item_name = f"{item.product_name} ({item.size_name})"
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

                for extra in item.histories_items_extras:
                    extra_row = hist_meta.copy()
                    extra_row.update(
                        {
                            "Type": "Extra",
                            "Item / Extra": f" └─ {extra.extra_name}",
                            "Quantity": extra.quantity,
                            "Price at Time": float(extra.price_at_time or 0),
                            "Subtotal": float(extra.price_at_time or 0) * extra.quantity,
                        }
                    )
                    items_data.append(extra_row)

        items_df = pd.DataFrame(items_data)

        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            orders_df.to_excel(writer, sheet_name="Orders Overview", index=False)
            summary_df.to_excel(writer, sheet_name="History Summary", index=False)
            items_df.to_excel(writer, sheet_name="Detailed Items & Extras", index=False)

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


class OrderService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = OrderRepository(session)
        self.branch_repo = BranchRepository(session)
        self.table_repo = TableRepository(session)
        self.menu_item_repo = MenuItemRepository(session)
        self.history_service = OrderHistoryService(session)
        self.logger = structlog.get_logger("OrderService")

    async def _release_table(self, table_id: int | None) -> None:
        if table_id:
            table = await self.table_repo.get_one(table_id)
            if table:
                table.is_available = True
                await self.session.flush()

    async def _occupy_table(self, table_id: int | None) -> None:
        if table_id:
            table = await self.table_repo.get_one(table_id)
            if not table:
                raise NotFoundException(f"Table {table_id} not found")
            table.is_available = False
            await self.session.flush()

    async def get(self, order_id: int) -> OrderModel:
        obj = await self.repo.get_one(order_id)
        if not obj:
            raise NotFoundException(f"Order {order_id} not found")
        return obj

    async def list_by_branch(self, branch_id: int, skip: int = 0, limit: int = 500) -> Sequence[OrderModel]:
        return await self.repo.get_by_branch(branch_id, skip, limit)

    async def create(self, data: OrderCreate, cashier_id: int) -> OrderModel:
        branch = await self.branch_repo.get_one(data.branch_id)
        if not branch:
            raise NotFoundException(f"Branch {data.branch_id} not found")

        order = await self.repo.create({
            "cashier_id": cashier_id,
            "branch_id": data.branch_id,
            "table_id": data.table_id,
            "destination": getattr(data, "destination", None),
            "total_amount": data.total_amount,
            "action": ActionEnum.CREATE,
            "payment_method": data.payment_method or PaymentEnum.CASH,
        })

        for item in data.items:
            menu_item = await self.menu_item_repo.get_one(item.menu_item_id)
            if not menu_item:
                raise NotFoundException(f"Menu item {item.menu_item_id} not found")
            order_item = OrderItemModel(
                order_id=order.id,
                menu_item_id=item.menu_item_id,
                quantity=item.quantity,
                price_at_time=item.price_at_time,
                product_name=menu_item.product.name if menu_item.product else "Deleted Product",
                size_name=menu_item.size.name if menu_item.size else "Deleted Size",
            )
            self.session.add(order_item)
            await self.session.flush()
            for extra in item.extras:
                menu_item_extra = next(
                    (
                        menu_extra
                        for menu_extra in menu_item.menu_items_extras
                        if menu_extra.id == extra.menu_item_extra_id
                    ),
                    None,
                )
                if not menu_item_extra:
                    raise NotFoundException(f"Menu item extra {extra.menu_item_extra_id} not found")
                self.session.add(OrderItemExtraModel(
                    order_item_id=order_item.id,
                    menu_item_extra_id=extra.menu_item_extra_id,
                    quantity=extra.quantity,
                    price_at_time=extra.price_at_time,
                    extra_name=menu_item_extra.extra.name if menu_item_extra.extra else "Deleted Extra",
                ))

        await self._occupy_table(data.table_id)
        
        # Load order with details for snapshot
        refreshed_order = await self.repo.get_one(order.id)
        await self.history_service.create_snapshot(refreshed_order, cashier_id, ActionEnum.CREATE)
        
        await self.session.commit()
        return refreshed_order

    async def update_status(self, order_id: int, data: OrderUpdate, cashier_id: int) -> OrderModel:
        obj = await self.get(order_id)
        update_data = data.model_dump(exclude_unset=True)
        if update_data:
            await self.repo.update(obj, update_data)
        
        refreshed_order = await self.repo.get_one(order_id)
        await self.history_service.create_snapshot(refreshed_order, cashier_id, ActionEnum.UPDATE)
        
        await self.session.commit()
        return refreshed_order

    async def checkout(self, order_id: int, payment_method: PaymentEnum, cashier_id: int) -> OrderModel:
        obj = await self.get(order_id)
        if obj.action in (ActionEnum.PAY, ActionEnum.CANCEL):
            raise ValueError("Order is already finalized")
        await self.repo.update(obj, {"action": ActionEnum.PAY, "payment_method": payment_method})
        await self._release_table(obj.table_id)
        
        refreshed_order = await self.repo.get_one(order_id)
        await self.history_service.create_snapshot(refreshed_order, cashier_id, ActionEnum.PAY)
        
        await self.session.commit()
        return refreshed_order

    async def cancel(self, order_id: int, cashier_id: int, reason: str | None = None) -> OrderModel:
        obj = await self.get(order_id)
        if obj.action in (ActionEnum.PAY, ActionEnum.CANCEL):
            raise ValueError("Order is already finalized")
        await self.repo.update(obj, {"action": ActionEnum.CANCEL})
        await self._release_table(obj.table_id)
        
        refreshed_order = await self.repo.get_one(order_id)
        await self.history_service.create_snapshot(refreshed_order, cashier_id, ActionEnum.CANCEL)
        
        await self.session.commit()
        return refreshed_order

    async def add_items(self, order_id: int, items: list[OrderItemCreate], cashier_id: int) -> OrderModel:
        obj = await self.get(order_id)
        if obj.action in (ActionEnum.PAY, ActionEnum.CANCEL):
            raise ValueError("Cannot modify a finalized order")
        for item in items:
            order_item = OrderItemModel(
                order_id=order_id,
                menu_item_id=item.menu_item_id,
                quantity=item.quantity,
                price_at_time=item.price_at_time,
            )
            self.session.add(order_item)
            await self.session.flush()
            for extra in item.extras:
                self.session.add(OrderItemExtraModel(
                    order_item_id=order_item.id,
                    menu_item_extra_id=extra.menu_item_extra_id,
                    quantity=extra.quantity,
                    price_at_time=extra.price_at_time,
                ))
        await self.session.flush()
        refreshed = await self.repo.get_one(order_id)
        total = sum(
            (i.price_at_time * i.quantity) + sum(e.price_at_time * e.quantity for e in i.order_item_extras)
            for i in refreshed.order_items
        )
        refreshed.total_amount = total
        
        await self.history_service.create_snapshot(refreshed, cashier_id, ActionEnum.UPDATE)
        await self.session.commit()
        return refreshed

    async def update_item_quantity(self, order_id: int, order_item_id: int, quantity: int, cashier_id: int) -> OrderModel:
        obj = await self.get(order_id)
        if obj.action in (ActionEnum.PAY, ActionEnum.CANCEL):
            raise ValueError("Cannot modify a finalized order")
        item = next((i for i in obj.order_items if i.id == order_item_id), None)
        if not item:
            raise NotFoundException(f"Order item {order_item_id} not found")
        item.quantity = quantity
        await self.session.flush()
        refreshed = await self.repo.get_one(order_id)
        total = sum(
            (i.price_at_time * i.quantity) + sum(e.price_at_time * e.quantity for e in i.order_item_extras)
            for i in refreshed.order_items
        )
        refreshed.total_amount = total
        
        await self.history_service.create_snapshot(refreshed, cashier_id, ActionEnum.UPDATE)
        await self.session.commit()
        return refreshed

    async def remove_item(self, order_id: int, order_item_id: int, cashier_id: int) -> OrderModel:
        obj = await self.get(order_id)
        if obj.action in (ActionEnum.PAY, ActionEnum.CANCEL):
            raise ValueError("Cannot modify a finalized order")
        item = next((i for i in obj.order_items if i.id == order_item_id), None)
        if not item:
            raise NotFoundException(f"Order item {order_item_id} not found")
        await self.session.delete(item)
        await self.session.flush()
        refreshed = await self.repo.get_one(order_id)
        total = sum(
            (i.price_at_time * i.quantity) + sum(e.price_at_time * e.quantity for e in i.order_item_extras)
            for i in refreshed.order_items
        )
        refreshed.total_amount = total
        
        await self.history_service.create_snapshot(refreshed, cashier_id, ActionEnum.UPDATE)
        await self.session.commit()
        return refreshed

    async def update_table(self, order_id: int, table_id: int | None, cashier_id: int) -> OrderModel:
        obj = await self.get(order_id)
        if obj.action in (ActionEnum.PAY, ActionEnum.CANCEL):
            raise ValueError("Cannot modify a finalized order")
        old_table_id = obj.table_id
        if old_table_id != table_id:
            await self._release_table(old_table_id)
            await self._occupy_table(table_id)
            obj.table_id = table_id
            await self.session.flush()
        
        refreshed_order = await self.repo.get_one(order_id)
        await self.history_service.create_snapshot(refreshed_order, cashier_id, ActionEnum.UPDATE)
        await self.session.commit()
        return refreshed_order

    async def clear_branch_history(self, branch_id: int) -> int:
        branch = await self.branch_repo.get_one(branch_id)
        if not branch:
            raise NotFoundException(f"Branch {branch_id} not found")
        result = await self.session.execute(
            select(OrderModel).where(
                OrderModel.branch_id == branch_id,
                OrderModel.action.in_([ActionEnum.PAY, ActionEnum.CANCEL])
            )
        )
        orders = result.scalars().all()
        count = len(orders)
        for order in orders:
            await self.session.delete(order)
        await self.session.commit()
        return count
