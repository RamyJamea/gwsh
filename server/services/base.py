import structlog
from typing import Generic, TypeVar, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from ..helpers.exceptions import NotFoundException
from ..repositories.base import BaseRepository

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseCatalog(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(
        self,
        session: AsyncSession,
        repository: BaseRepository[ModelType],
        model_name: str,
    ):
        self.session = session
        self.repo = repository
        self.model_name = model_name
        self.logger = structlog.get_logger(self.__class__.__name__)

    async def get(self, id: int) -> ModelType:
        obj = await self.repo.get_one(id)
        if not obj:
            message = f"{self.model_name.capitalize()} with id: {id} is not found"
            self.logger.error(f"{self.model_name}_not_found", id=id)
            raise NotFoundException(message)
        return obj

    async def get_multi(self, skip: int = 0, limit: int = 100) -> Sequence[ModelType]:
        objs = await self.repo.get_pagination(skip, limit)
        return objs

    async def create(self, data: CreateSchemaType) -> ModelType:
        try:
            payload = data.model_dump()
            obj = await self.repo.create_one(payload)
            await self.session.commit()
            await self.session.refresh(obj)

            self.logger.info(f"{self.model_name}_create_success")
            return obj
        except Exception as e:
            await self.session.rollback()
            self.logger.error(f"{self.model_name}_create_failed", error=str(e))
            raise RuntimeError(f"Failed to create {self.model_name} -- {e}") from e

    async def update(self, id: int, data: UpdateSchemaType) -> ModelType:
        obj = await self.get(id)
        try:
            payload = data.model_dump(exclude_unset=True)
            updated_obj = await self.repo.update_one(obj, payload)
            await self.session.commit()
            await self.session.refresh(updated_obj)

            self.logger.info(f"{self.model_name}_update_success", id=id)
            return updated_obj
        except Exception as e:
            await self.session.rollback()
            self.logger.error(f"{self.model_name}_update_failed", id=id, error=str(e))
            raise RuntimeError(f"Failed to update {self.model_name} -- {e}") from e

    async def delete_hard(self, id: int) -> None:
        obj = await self.get(id)
        try:
            await self.repo.delete_hard(obj)
            await self.session.commit()
            self.logger.info(f"{self.model_name}_hard_delete_success", id=id)
        except Exception as e:
            await self.session.rollback()
            self.logger.error(
                f"{self.model_name}_hard_delete_failed", id=id, error=str(e)
            )
            raise RuntimeError(f"Failed to delete {self.model_name} -- {e}") from e
