from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from .base import Base, AuditMixin, ORPHAN
from ..core.enums import TableEnum

if TYPE_CHECKING:
    from .product import ProductModel


class CategoryModel(Base, AuditMixin):
    __tablename__ = TableEnum.CATEGORIES.value

    name: Mapped[str] = mapped_column(String(255), index=True, unique=True)

    products: Mapped[list["ProductModel"]] = relationship(
        back_populates="category", cascade=ORPHAN, passive_deletes=True
    )
