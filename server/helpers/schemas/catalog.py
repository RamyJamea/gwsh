from pydantic import BaseModel
from .base import AuditSchema


class SizeBase(BaseModel):
    name: str


class SizeCreate(SizeBase): ...


class SizeResponse(SizeBase, AuditSchema): ...
