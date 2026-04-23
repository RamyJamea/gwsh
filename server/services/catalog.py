from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from ..helpers.enums import TableEnum
from ..helpers.schemas import *
from ..repositories import *
from ..models import SizeModel, ProductModel, CategoryModel, ExtraModel
from .base import BaseCatalog


class SizeManagement(BaseCatalog[SizeModel, SizeCreate, SizeUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(
            session=session,
            repository=SizeRepository(session),
            model_name=TableEnum.SIZES.value,
        )


class ExtraManagement(BaseCatalog[ExtraModel, ExtraCreate, ExtraUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(
            session=session,
            repository=ExtraRepository(session),
            model_name=TableEnum.EXTRAS.value,
        )


class ProductManagement(BaseCatalog[ProductModel, ProductCreate, ProductUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(
            session=session,
            repository=ProductRepository(session),
            model_name=TableEnum.PRODUCTS.value,
        )
        self.category_repo = CategoryRepository(session)

    async def _validate_category(self, category_id: int | None) -> None:
        if category_id:
            category = await self.category_repo.get_one(category_id)
            if not category:
                raise ValueError(f"Category with id {category_id} does not exist.")

    async def create(self, data: ProductCreate):
        await self._validate_category(category_id=data.category_id)
        new_obj = await super().create(data)
        return new_obj

    async def update(self, id: int, data: ProductUpdate):
        await self._validate_category(data.category_id)
        new_obj = await super().update(id, data)
        return new_obj


class CategoryManagement(BaseCatalog[CategoryModel, CategoryCreate, CategoryUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(
            session=session,
            repository=CategoryRepository(session),
            model_name=TableEnum.CATEGORIES.value,
        )

    async def list_category_products(
        self, id: int, skip: int = 0, limit: int = 100
    ) -> Sequence[CategoryRepository]:
        products = await self.repo.get_category_products(id, skip, limit)
        return products
