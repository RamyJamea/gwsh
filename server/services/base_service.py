from typing import Generic, TypeVar, Sequence, Any
from sqlalchemy.orm import Session
from ..repositories import BaseRepository

ModelT = TypeVar("ModelT")
CreateT = TypeVar("CreateT")
UpdateT = TypeVar("UpdateT")


class BaseService(Generic[ModelT, CreateT, UpdateT]):
    def __init__(self, session: Session, repository: BaseRepository[ModelT]):
        self.session = session
        self.repo = repository

    def get(self, id: int) -> ModelT:
        obj = self.repo.get_by_id(id)
        if not obj:
            raise ValueError(f"{self.repo.model.__name__} {id} not found")
        return obj

    def list(self, skip: int = 0, limit: int = 100) -> Sequence[ModelT]:
        return self.repo.get_all(skip=skip, limit=limit)

    def delete(self, id: int) -> None:
        obj = self.get(id)
        self.repo.delete(obj)
        self.session.commit()

    def _model_dump(self, data: Any, *, exclude_unset: bool = False) -> dict:
        if hasattr(data, "model_dump"):
            return data.model_dump(exclude_unset=exclude_unset)
        return dict(data)
