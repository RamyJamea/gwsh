from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from .base import BaseRepository
from ..models import BranchModel


class BranchRepository(BaseRepository[BranchModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, BranchModel)

    def get_one_details(self, branch_id: int) -> BranchModel | None:
        stmt = (
            select(BranchModel)
            .options(
                selectinload(BranchModel.tables),
                selectinload(BranchModel.users),
                selectinload(BranchModel.menu_items),
            )
            .where(BranchModel.id == branch_id)
        )
        return self.session.scalars(stmt).first()
