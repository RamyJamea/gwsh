import structlog
from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from ..repositories import UserRepository, BranchRepository
from ..helpers.schemas import UserCreate, UserUpdate
from ..helpers.auth import hash_password
from ..helpers.exceptions import NotFoundException
from ..models import UserModel


class UserManagement:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.branch_repo = BranchRepository(session)
        self.user_repo = UserRepository(session)
        self.logger = structlog.get_logger(self.__class__.__name__)

    async def _get_user(
        self, username: str, include_deleted: bool = False
    ) -> UserModel:
        return await self.get_user(username, include_deleted)

    async def _branch_exists(self, branch_id: int):
        branch_obj = await self.branch_repo.get_one(branch_id)
        if not branch_obj:
            self.logger.error("branch_not_exists", branch_id=branch_id)
            raise NotFoundException(f"branch with id: {branch_id} not exists")

    async def get_user(self, username: str, include_deleted: bool = False) -> UserModel:
        user_obj = await self.user_repo.get_one_username(username, include_deleted)

        if not user_obj:
            self.logger.error("user_not_found", username=username)
            raise NotFoundException(f"user_not_found: {username}")

        return user_obj

    async def get_users(
        self, skip: int = 0, limit: int = 100, include_deleted: bool = True
    ) -> Sequence[UserModel] | None:
        users_obj = await self.user_repo.get_pagination(skip, limit, include_deleted)
        return users_obj

    async def create_user(self, data: UserCreate) -> UserModel:
        if data.branch_id is not None:
            await self._branch_exists(data.branch_id)

        payload = data.model_dump(exclude={"password"})
        payload["hashed_password"] = hash_password(data.password.get_secret_value())

        try:
            obj = await self.user_repo.create_one(payload)
            await self.session.commit()
            await self.session.refresh(obj)
            self.logger.info("user_create_success", username=data.username)
            return obj
        except Exception as e:
            await self.session.rollback()
            self.logger.error("user_create_failed", username=data.username)
            raise RuntimeError(f"user_create_failed -- {e}")

    async def update_user(self, username: str, data: UserUpdate) -> UserModel:
        user_obj = await self._get_user(username)
        payload = data.model_dump(exclude_unset=True)

        if "password" in payload and payload["password"] is not None:
            row_password = payload.pop("password").get_secret_value()
            payload["hashed_password"] = hash_password(row_password)

        if "branch_id" in payload and payload["branch_id"] is not None:
            await self._branch_exists(payload["branch_id"])

        try:
            new_user = await self.user_repo.update_one(user_obj, payload)
            await self.session.commit()
            await self.session.refresh(new_user)
            self.logger.info("user_update_success", username=username)
            return new_user
        except Exception as e:
            await self.session.rollback()
            self.logger.error("user_update_failed", username=username)
            raise RuntimeError(f"user_update_failed -- {e}")

    async def delete_hard_user(self, username: str):
        user_obj = await self._get_user(username, True)
        try:
            await self.user_repo.delete_hard(user_obj)
            await self.session.commit()
            self.logger.info("user_hard_delete_success", username=username)
        except Exception as e:
            await self.session.rollback()
            self.logger.error("user_hard_delete_failed", username=username)
            raise RuntimeError(f"user_hard_delete_failed -- {e}")

    async def delete_soft_user(self, username: str):
        user_obj = await self._get_user(username)
        try:
            await self.user_repo.delete_soft(user_obj)
            await self.session.commit()
            self.logger.info("user_soft_delete_success", username=username)
        except Exception as e:
            await self.session.rollback()
            self.logger.error("user_soft_delete_failed", username=username)
            raise RuntimeError(f"user_soft_delete_failed -- {e}")

    async def revive_user(self, username: str) -> UserModel:
        user_obj = await self._get_user(username, True)
        try:
            await self.user_repo.revive_one(user_obj)
            await self.session.commit()
            await self.session.refresh(user_obj)
            self.logger.info("user_revive_success", username=username)
            return user_obj
        except Exception as e:
            await self.session.rollback()
            self.logger.error("user_revive_failed", username=username)
            raise RuntimeError(f"user_revive_failed -- {e}")
