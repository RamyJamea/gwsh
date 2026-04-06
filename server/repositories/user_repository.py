from typing import Sequence
from sqlalchemy.orm import Session
from sqlalchemy import select
from .base_repository import BaseRepository
from ..models import User


class UserRepository(BaseRepository[User]):
    def __init__(self, session: Session):
        super().__init__(session, User)

    def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username)
        return self.session.scalars(stmt).first()

    def get_active_users_by_branch(self, branch_id: int) -> Sequence[User]:
        stmt = select(User).where(User.branch_id == branch_id, User.is_active == True)
        return self.session.scalars(stmt).all()
