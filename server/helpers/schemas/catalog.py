from pydantic import BaseModel
from .base import AuditSchema


class SizeBase(BaseModel):
    name: str


class SizeCreate(SizeBase): ...


class SizeUpdate(BaseModel):
    name: str | None = None


class SizeResponse(SizeBase, AuditSchema): ...


class ExtraBase(BaseModel):
    name: str


class ExtraCreate(ExtraBase): ...


class ExtraUpdate(BaseModel):
    name: str | None = None


class ExtraResponse(ExtraBase, AuditSchema): ...


class ProductBase(BaseModel):
    name: str
    category_id: int | None = None
    image_url: str | None = None


class ProductCreate(ProductBase): ...


class ProductUpdate(BaseModel):
    name: str | None = None
    category_id: int | None = None
    image_url: str | None = None


class ProductResponse(ProductBase, AuditSchema): ...


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase): ...


class CategoryUpdate(BaseModel):
    name: str | None = None


class CategoryResponse(CategoryBase, AuditSchema):
    products: list[ProductResponse] | None = []
