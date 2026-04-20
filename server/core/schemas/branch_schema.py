from pydantic import BaseModel, ConfigDict
from datetime import datetime


class BranchBase(BaseModel):
    name: str

    model_config = ConfigDict(from_attributes=True)


class BranchCreate(BranchBase):
    pass


class BranchUpdate(BaseModel):
    name: str | None = None


class BranchRead(BranchBase):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class TableBase(BaseModel):
    num_chairs: int
    is_available: bool = True
    table_number: int | None = None

    model_config = ConfigDict(from_attributes=True)


class TableCreate(TableBase):
    branch_id: int


class TableUpdate(BaseModel):
    num_chairs: int | None = None
    is_available: bool | None = None


class TableRead(TableBase):
    id: int
    branch_id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
