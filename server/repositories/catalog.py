from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .base import BaseRepository
from ..models import ExtraModel, SizeModel, ProductModel, CategoryModel


class ExtraRepository(BaseRepository[ExtraModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ExtraModel)


class SizeRepository(BaseRepository[SizeModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, SizeModel)


class ProductRepository(BaseRepository[ProductModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ProductModel)


class CategoryRepository(BaseRepository[CategoryModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, CategoryModel)

    async def get_category_products(
        self, category_id: int, skip: int = 0, limit: int = 100
    ) -> Sequence[ProductModel]:
        stmt = (
            select(ProductModel)
            .where(ProductModel.category_id == category_id)
            .offset(skip)
            .limit(limit)
        )
        results = await self.session.scalars(stmt)
        return results.all()
