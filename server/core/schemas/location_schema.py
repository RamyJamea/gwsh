from pydantic import BaseModel
from .base_schema import AuditSchema


class TableBase(BaseModel):
    num_chairs: int
    is_available: bool = True


class TableCreate(TableBase):
    branch_id: int


class TableUpdate(BaseModel):
    num_chairs: int | None = None
    is_available: bool | None = None


class TableResponse(TableBase, AuditSchema):
    branch_id: int


class BranchBase(BaseModel):
    name: str


class BranchCreate(BranchBase):
    pass


class BranchUpdate(BaseModel):
    name: str | None = None


class BranchResponse(BranchBase, AuditSchema):
    pass


class BranchDetailResponse(BranchResponse):
    tables: list[TableResponse] = []
