from sqlalchemy.orm import Session
from ..repositories import BranchRepository, RestaurantTableRepository
from ..core.schemas import BranchCreate, BranchUpdate, TableCreate, TableUpdate
from .base_service import BaseService


class BranchService(BaseService):
    def __init__(self, session: Session):
        super().__init__(session, BranchRepository(session))

    def create(self, data: BranchCreate):
        obj = self.repo.create(data.model_dump())
        self.session.commit()
        return obj

    def update(self, branch_id: int, data: BranchUpdate):
        obj = self.get(branch_id)
        self.repo.update(obj, data.model_dump(exclude_unset=True))
        self.session.commit()
        return obj


class TableService(BaseService):
    def __init__(self, session: Session):
        super().__init__(session, RestaurantTableRepository(session))
        self.branch_repo = BranchRepository(session)

    def create(self, data: TableCreate):
        if not self.branch_repo.get_by_id(data.branch_id):
            raise ValueError("Branch not found")
        
        tables = self.repo.get_tables_by_branch(data.branch_id, limit=9999)
        max_num = max([t.table_number or 0 for t in tables]) if tables else 0
        
        dump = data.model_dump()
        dump["table_number"] = max_num + 1

        obj = self.repo.create(dump)
        self.session.commit()
        return obj

    def update(self, table_id: int, data: TableUpdate):
        obj = self.get(table_id)
        self.repo.update(obj, data.model_dump(exclude_unset=True))
        self.session.commit()
        return obj
