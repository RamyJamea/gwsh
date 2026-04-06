from pydantic import BaseModel
from .base_schema import AuditSchema


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryResponse(CategoryBase, AuditSchema):
    pass


class ProductBase(BaseModel):
    name: str


class ProductCreate(ProductBase):
    category_id: int


class ProductUpdate(BaseModel):
    name: str | None = None
    category_id: int | None = None


class ProductResponse(ProductBase, AuditSchema):
    category_id: int


class SizeBase(BaseModel):
    name: str


class SizeCreate(SizeBase):
    pass


class SizeResponse(SizeBase, AuditSchema):
    pass


class ExtraBase(BaseModel):
    name: str


class ExtraCreate(ExtraBase):
    pass


class ExtraResponse(ExtraBase, AuditSchema):
    pass
