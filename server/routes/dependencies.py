from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from ..helpers.config import get_db
from ..services import UserManagement


def get_user_management(session: AsyncSession = Depends(get_db)):
    return UserManagement(session)
