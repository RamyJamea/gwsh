from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .base import BaseRepository
from ..models import UserModel


class UserRepository(BaseRepository[UserModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, UserModel)

    async def get_one_username(
        self, username: str, include_deleted: bool = False
    ) -> UserModel | None:
        stmt = select(UserModel).where(UserModel.username == username)
        stmt = self._apply_soft_delete_filter(stmt, include_deleted)
        
        result = await self.session.scalars(stmt).first()
        return result

    async def get_many_users_active_branch(
        self, branch_id: int, include_deleted: bool = False
    ) -> Sequence[UserModel]:
        stmt = select(UserModel).where(UserModel.branch_id == branch_id, UserModel.is_active == True)
        stmt = self._apply_soft_delete_filter(stmt, include_deleted)

        results = await self.session.scalars(stmt).all()
        return results
