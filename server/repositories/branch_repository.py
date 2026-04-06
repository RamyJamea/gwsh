from typing import Sequence
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from .base_repository import BaseRepository
from ..models import Branch, RestaurantTable


class BranchRepository(BaseRepository[Branch]):
    def __init__(self, session: Session):
        super().__init__(session, Branch)

    def get_branch_with_details(self, branch_id: int) -> Branch | None:
        stmt = (
            select(Branch)
            .options(
                selectinload(Branch.tables),
                selectinload(Branch.users),
                selectinload(Branch.menu_items),
            )
            .where(Branch.id == branch_id)
        )
        return self.session.scalars(stmt).first()

    def get_branches_by_name_like(
        self, name_pattern: str, skip: int = 0, limit: int = 100
    ) -> Sequence[Branch]:
        stmt = (
            select(Branch)
            .where(Branch.name.ilike(f"%{name_pattern}%"))
            .offset(skip)
            .limit(limit)
        )
        return self.session.scalars(stmt).all()


class RestaurantTableRepository(BaseRepository[RestaurantTable]):
    def __init__(self, session: Session):
        super().__init__(session, RestaurantTable)

    def get_tables_by_branch(
        self, branch_id: int, skip: int = 0, limit: int = 100
    ) -> Sequence[RestaurantTable]:
        """Get all tables for a specific branch."""
        stmt = (
            select(RestaurantTable)
            .where(RestaurantTable.branch_id == branch_id)
            .offset(skip)
            .limit(limit)
        )
        return self.session.scalars(stmt).all()

    def get_available_tables_by_branch(
        self, branch_id: int
    ) -> Sequence[RestaurantTable]:
        stmt = select(RestaurantTable).where(
            RestaurantTable.branch_id == branch_id, RestaurantTable.is_available == True
        )
        return self.session.scalars(stmt).all()

    def get_table_with_current_order(self, table_id: int) -> RestaurantTable | None:
        stmt = (
            select(RestaurantTable)
            .options(selectinload(RestaurantTable.orders))
            .where(RestaurantTable.id == table_id)
        )
        return self.session.scalars(stmt).first()
