import structlog
from typing import Sequence
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ...helpers.config import get_db
from ...helpers.exceptions import NotFoundException
from ...helpers.schemas import SizeCreate
from ...models import SizeModel
from ...repositories import SizeRepository


class SizeManagement:
    def __init__(self, session: AsyncSession = Depends(get_db)):
        self.session = session
        self.size_repo = SizeRepository(session)
        self.logger = structlog.get_logger(self.__class__.__name__)

    async def get_size(self, id: int) -> SizeModel:
        result = await self.size_repo.get_one(id)
        if not result:
            message = f"Size with id: {id} is not found"
            self.logger.error(message)
            raise NotFoundException(message)
        return result

    async def get_sizes(self, skip: int = 0, limit: int = 100) -> Sequence[SizeModel]:
        results = await self.size_repo.get_pagination(skip, limit)
        if not results:
            message = f"No sizes exists"
            self.logger.error(message)
            raise NotFoundException(message)
        return results

    async def create_sizes(self, data: SizeCreate) -> SizeModel:
        try:
            new_data = await self.size_repo.create_one(data.model_dump())
            await self.session.commit()
            await self.session.refresh(new_data)
            self.logger.info(f"Success create Size: {data.name}")
            return new_data
        except Exception as e:
            await self.session.rollback()
            self.logger.error(f"Failed create Size: {data.name}")
            raise RuntimeError(f"Failed to create size {data.name} -- {e}")

    async def delete_sizes(self, id: int):
        size_obj = await self.get_size(id)
        try:
            await self.size_repo.delete_hard(size_obj)
            await self.session.commit()
            self.logger.info("size_hard_delete_success", size=size_obj.name)
        except Exception as e:
            await self.session.rollback()
            self.logger.error("size_hard_delete_failed", size=size_obj.name)
            raise RuntimeError(f"size_hard_delete_failed -- {e}")
