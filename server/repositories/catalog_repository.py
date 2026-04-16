from typing import Sequence
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from .base import BaseRepository
from ..models import Product, Size, Extra, Category


class ProductRepository(BaseRepository[Product]):
    def __init__(self, session: Session):
        super().__init__(session, Product)

    def get_product_with_menu_items(self, product_id: int) -> Product | None:
        stmt = (
            select(Product)
            .options(selectinload(Product.menu_items))
            .where(Product.id == product_id)
        )
        return self.session.scalars(stmt).first()

    def get_products_by_category(
        self, category_id: int, skip: int = 0, limit: int = 100
    ) -> Sequence[Product]:
        stmt = (
            select(Product)
            .where(Product.category_id == category_id)
            .offset(skip)
            .limit(limit)
        )
        return self.session.scalars(stmt).all()


class SizeRepository(BaseRepository[Size]):
    def __init__(self, session: Session):
        super().__init__(session, Size)

    def get_size_with_menu_items(self, size_id: int) -> Size | None:
        stmt = (
            select(Size)
            .options(selectinload(Size.menu_items))
            .where(Size.id == size_id)
        )
        return self.session.scalars(stmt).first()

    def get_all_sizes(self) -> Sequence[Size]:
        return self.get_all()


class ExtraRepository(BaseRepository[Extra]):
    def __init__(self, session: Session):
        super().__init__(session, Extra)

    def get_extra_with_menu_item_extras(self, extra_id: int) -> Extra | None:
        stmt = (
            select(Extra)
            .options(selectinload(Extra.menu_item_extras))
            .where(Extra.id == extra_id)
        )
        return self.session.scalars(stmt).first()


class CategoryRepository(BaseRepository[Category]):
    def __init__(self, session: Session):
        super().__init__(session, Category)

    def get_category_with_products(self, category_id: int) -> Category | None:
        stmt = (
            select(Category)
            .options(selectinload(Category.products).selectinload("menu_items"))
            .where(Category.id == category_id)
        )
        return self.session.scalars(stmt).first()

    def get_all_with_products(
        self, skip: int = 0, limit: int = 100
    ) -> Sequence[Category]:
        stmt = (
            select(Category)
            .options(selectinload(Category.products))
            .offset(skip)
            .limit(limit)
        )
        return self.session.scalars(stmt).all()
