from sqlalchemy.orm import Session
from typing import Sequence
from ..repositories import CategoryRepository, ProductRepository
from ..repositories import SizeRepository, ExtraRepository
from ..helpers.schemas import CategoryCreate, CategoryUpdate
from ..helpers.schemas import ProductCreate, ProductUpdate
from ..helpers.schemas import SizeCreate, ExtraCreate
from ..models import Product
from .base_service import BaseService


class CategoryService(BaseService):
    def __init__(self, session: Session):
        super().__init__(session, CategoryRepository(session))

    def create(self, data: CategoryCreate):
        obj = self.repo.create(data.model_dump())
        self.session.commit()
        return obj

    def update(self, category_id: int, data: CategoryUpdate):
        obj = self.get(category_id)
        self.repo.update(obj, data.model_dump(exclude_unset=True))
        self.session.commit()
        return obj


class ProductService(BaseService):
    def __init__(self, session: Session):
        super().__init__(session, ProductRepository(session))
        self.category_repo = CategoryRepository(session)

    def create(self, data: ProductCreate):
        if not self.category_repo.get_by_id(data.category_id):
            raise ValueError("Category not found")
        obj = self.repo.create(data.model_dump())
        self.session.commit()
        return obj

    def update(self, product_id: int, data: ProductUpdate):
        obj = self.get(product_id)
        payload = data.model_dump(exclude_unset=True)
        if "category_id" in payload and payload["category_id"] is not None:
            if not self.category_repo.get_by_id(payload["category_id"]):
                raise ValueError("Category not found")
        self.repo.update(obj, payload)
        self.session.commit()
        return obj

    def list_by_category(
        self, category_id: int, skip: int = 0, limit: int = 100
    ) -> Sequence["Product"]:
        return self.repo.get_products_by_category(category_id, skip, limit)


class SizeService(BaseService):
    def __init__(self, session: Session):
        super().__init__(session, SizeRepository(session))

    def create(self, data: SizeCreate):
        obj = self.repo.create(data.model_dump())
        self.session.commit()
        return obj

    def update(self, size_id: int, data: SizeCreate):
        obj = self.get(size_id)
        self.repo.update(obj, data.model_dump(exclude_unset=True))
        self.session.commit()
        return obj


class ExtraService(BaseService):
    def __init__(self, session: Session):
        super().__init__(session, ExtraRepository(session))

    def create(self, data: ExtraCreate):
        obj = self.repo.create(data.model_dump())
        self.session.commit()
        return obj

    def update(self, extra_id: int, data: ExtraCreate):
        obj = self.get(extra_id)
        self.repo.update(obj, data.model_dump(exclude_unset=True))
        self.session.commit()
        return obj
