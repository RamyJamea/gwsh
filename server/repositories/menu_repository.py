from typing import Sequence
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from .base_repository import BaseRepository
from ..models import MenuItem, MenuItemExtra


class MenuItemRepository(BaseRepository[MenuItem]):
    def __init__(self, session: Session):
        super().__init__(session, MenuItem)

    def get_by_branch_product_size(
        self, branch_id: int, product_id: int, size_id: int
    ) -> MenuItem | None:
        stmt = select(self.model).where(
            self.model.branch_id == branch_id,
            self.model.product_id == product_id,
            self.model.size_id == size_id,
        )
        return self.session.scalars(stmt).first()

    def get_by_branch(
        self, branch_id: int, skip: int = 0, limit: int = 100
    ) -> Sequence[MenuItem]:
        stmt = (
            select(MenuItem)
            .where(MenuItem.branch_id == branch_id)
            .offset(skip)
            .limit(limit)
        )
        return self.session.scalars(stmt).all()

    def get_menu_item_with_extras(self, menu_item_id: int) -> MenuItem | None:
        stmt = (
            select(MenuItem)
            .options(
                selectinload(MenuItem.menu_items_extras).selectinload(
                    MenuItemExtra.extra
                ),
                selectinload(MenuItem.product),
                selectinload(MenuItem.size),
            )
            .where(MenuItem.id == menu_item_id)
        )
        return self.session.scalars(stmt).first()


class MenuItemExtraRepository(BaseRepository[MenuItemExtra]):
    def __init__(self, session: Session):
        super().__init__(session, MenuItemExtra)

    def get_extras_for_menu_item(self, menu_item_id: int) -> Sequence[MenuItemExtra]:
        stmt = (
            select(MenuItemExtra)
            .options(selectinload(MenuItemExtra.extra))
            .where(MenuItemExtra.menu_item_id == menu_item_id)
        )
        return self.session.scalars(stmt).all()
