from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from ...helpers.config import get_db
from ...services import *


def get_user_management(session: AsyncSession = Depends(get_db)):
    return UserManagement(session)


def get_auth(user_management: UserManagement = Depends(get_user_management)):
    return Authentication(user_management)


def get_size_management(session: AsyncSession = Depends(get_db)):
    return SizeManagement(session)


def get_extra_management(session: AsyncSession = Depends(get_db)):
    return ExtraManagement(session)


def get_product_management(session: AsyncSession = Depends(get_db)):
    return ProductManagement(session)


def get_category_management(session: AsyncSession = Depends(get_db)):
    return CategoryManagement(session)
