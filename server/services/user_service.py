from sqlalchemy.orm import Session
from ..repositories import UserRepository, BranchRepository
from ..core.schemas import UserCreate, UserUpdate
from ..core import get_password_hash
from ..models import User
from .base_service import BaseService


class UserService(BaseService):
    def __init__(self, session: Session):
        super().__init__(session, UserRepository(session))
        self.branch_repo = BranchRepository(session)

    def get_by_username(self, username: str) -> User | None:
        return self.repo.get_by_username(username)

    def create(self, data: UserCreate) -> User:
        if not self.branch_repo.get_by_id(data.branch_id):
            raise ValueError("Branch not found")

        payload = data.model_dump()
        payload["hashed_password"] = get_password_hash(payload.pop("password"))
        obj = self.repo.create(payload)
        self.session.commit()
        self.session.refresh(obj)
        return obj

    def update(self, user_id: int, data: UserUpdate) -> User:
        obj = self.get(user_id)
        payload = data.model_dump(exclude_unset=True)

        if "password" in payload and payload["password"] is not None:
            payload["hashed_password"] = get_password_hash(payload.pop("password"))

        self.repo.update(obj, payload)
        self.session.commit()
        self.session.refresh(obj)
        return obj

    def reset_password(self, user_id: int, new_password: str) -> User:
        return self.update(user_id, UserUpdate(password=new_password))
