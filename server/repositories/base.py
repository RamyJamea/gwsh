from typing import TypeVar, Generic, Type, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, insert, Select, func
from ..models.base import Base
from ..helpers.exceptions import DuplicateRecordException

T = TypeVar("T", bound="Base")


class BaseRepository(Generic[T]):
    def __init__(self, session: AsyncSession, model: Type[T]):
        self.session = session
        self.model = model

    def _apply_soft_delete_filter(self, stmt: Select, include_deleted: bool) -> Select:
        if not include_deleted and hasattr(self.model, "deleted_at"):
            return stmt.where(self.model.deleted_at.is_(None))
        return stmt

    async def get_one(self, id: int, include_deleted: bool = False) -> T | None:
        stmt = select(self.model).where(self.model.id == id)
        stmt = self._apply_soft_delete_filter(stmt, include_deleted)

        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_many(
        self, ids: list[int], include_deleted: bool = False
    ) -> Sequence[T]:
        stmt = select(self.model).where(self.model.id.in_(ids))
        stmt = self._apply_soft_delete_filter(stmt, include_deleted)

        result = await self.session.scalars(stmt)
        return result.all()

    async def get_pagination(
        self, skip: int = 0, limit: int = 100, include_deleted: bool = False, **filters
    ) -> Sequence[T] | None:
        stmt = select(self.model).filter_by(**filters)
        stmt = self._apply_soft_delete_filter(stmt, include_deleted)
        stmt = stmt.offset(skip).limit(limit)

        result = await self.session.scalars(stmt)
        return result.all()

    async def create_one(self, obj_in: dict) -> T:
        try:
            db_obj = self.model(**obj_in)
            self.session.add(db_obj)
            await self.session.flush()
            return db_obj

        except IntegrityError as e:
            await self.session.rollback()
            raise DuplicateRecordException(f"{self.model.__name__} exists -- {e}")

    async def create_bulk(self, objs_in: list[dict]) -> Sequence[T]:
        if not objs_in:
            return []

        try:
            stmt = insert(self.model).returning(self.model)
            result = await self.session.scalars(stmt, objs_in)
            db_objs = result.all()
            await self.session.flush()
            return db_objs

        except IntegrityError as e:
            await self.session.rollback()
            raise DuplicateRecordException(f"Record already exists -- {e}")

    async def update_one(self, db_obj: T, updates: dict) -> T:
        try:
            for field, value in updates.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
            await self.session.flush()
            return db_obj
        except IntegrityError as e:
            await self.session.rollback()
            raise DuplicateRecordException(f"Failed update -- {e}")

    async def delete_hard(self, db_obj: T) -> None:
        try:
            self.session.delete(db_obj)
            await self.session.flush()
        except IntegrityError as e:
            await self.session.rollback()
            raise DuplicateRecordException(f"Failed hard delete -- {e}")

    async def delete_soft(self, db_obj: T) -> None:
        try:
            if hasattr(db_obj, "deleted_at"):
                db_obj.deleted_at = func.now()
                await self.session.flush()
            else:
                self.session.delete(db_obj)
                await self.session.flush()
        except IntegrityError as e:
            await self.session.rollback()
            raise DuplicateRecordException(f"Failed soft delete -- {e}")

    async def revive_one(self, db_obj: T) -> None:
        try:
            if hasattr(db_obj, "deleted_at"):
                db_obj.deleted_at = None
                await self.session.flush()
        except IntegrityError as e:
            await self.session.rollback()
            raise DuplicateRecordException(f"Failed revive -- {e}")
