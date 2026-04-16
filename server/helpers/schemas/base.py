from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ORMBaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class AuditSchema(ORMBaseSchema):
    id: int
    created_at: datetime
    updated_at: datetime | None = None
    deleted_at: datetime | None = None
