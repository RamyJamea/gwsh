from pydantic import BaseModel
from .base import AuditSchema


class SizeBase(BaseModel):
    name: str


class SizeCreate(SizeBase): ...


class SizeUpdate(SizeBase): ...


class SizeResponse(SizeBase, AuditSchema): ...


class ExtraBase(BaseModel):
    name: str


class ExtraCreate(ExtraBase): ...


class ExtraUpdate(ExtraBase): ...


class ExtraResponse(ExtraBase, AuditSchema): ...


class ProductBase(BaseModel):
    category_id: int | None = None
    name: str
    image_url: str | None = None


class ProductCreate(ProductBase): ...


class ProductUpdate(ProductBase): ...


class ProductResponse(ProductBase, AuditSchema):
    extras: list[ExtraResponse] | None = None
    size: SizeResponse | None = None


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase): ...


class CategoryUpdate(CategoryBase): ...


class CategoryResponse(CategoryBase, AuditSchema):
    products: list[ProductResponse] | None = None
