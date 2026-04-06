from typing import TypeVar, Generic, Type, Sequence
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..models import Base

T = TypeVar("T", bound="Base")


class BaseRepository(Generic[T]):
    def __init__(self, session: Session, model: Type[T]):
        self.session = session
        self.model = model

    def get_by_id(self, id: int) -> T | None:
        return self.session.get(self.model, id)

    def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[T]:
        stmt = select(self.model).offset(skip).limit(limit)
        return self.session.scalars(stmt).all()

    def create(self, obj_in: dict) -> T:
        db_obj = self.model(**obj_in)
        self.session.add(db_obj)
        self.session.flush()
        return db_obj

    def update(self, db_obj: T, obj_in: dict) -> T:
        for field, value in obj_in.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        self.session.flush()
        return db_obj

    def delete(self, db_obj: T) -> None:
        self.session.delete(db_obj)
        self.session.flush()
