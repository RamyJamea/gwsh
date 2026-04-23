from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .helpers.security import hash_password
from .helpers.enums import RoleEnum
from .helpers.config import ASYNC_ENGINE
from .routes.management import user_management_router
from .routes.management import size_management_router
from .routes.management import extra_management_router
from .routes.authentication import auth_router
from .models import *


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with ASYNC_ENGINE.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(ASYNC_ENGINE) as session:
        result = await session.execute(
            select(UserModel).where(UserModel.username == "admin")
        )
        admin = result.scalar_one_or_none()

        if not admin:
            session.add(
                UserModel(
                    username="admin",
                    email="admin@nancysgun.com",
                    role=RoleEnum.ADMIN,
                    hashed_password=hash_password("36951Admin@"),
                    is_active=True,
                )
            )
            await session.commit()

    yield
    await ASYNC_ENGINE.dispose()


app = FastAPI(
    title="NancysGun",
    description="A robust API for managing cashiers, inventory, and sales orders.",
    version="1.0.0",
    lifespan=lifespan,
)


app.include_router(auth_router, prefix="/api/v1")
app.include_router(user_management_router, prefix="/api/v1")
app.include_router(size_management_router, prefix="/api/v1")
app.include_router(extra_management_router, prefix="/api/v1")


@app.get("/api/health", tags=["Root"])
def root_check():
    return {
        "status": "online",
        "message": "Welcome to the Point of Sale API. Visit /docs for the Swagger UI.",
    }


if __name__ == "__main__":
    import uvicorn

    print(r"""
⠀⠀⠀⠀⠀⠀⠀⠠⡧⠀⠀⠀⠄⠀⣆
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⡄⠀⠀⠀⢺⠂⠀⠀⠀⢀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣧
⠀⠐⠗⠀⠀⠀⠀⠁⠀⠀⠀⣼⣿⡏⣿⣷⡀⠀⠄⠀⠀⠀⠀⠀⠀⠀⠐⠺⠂⠀⠀⠀⠀⠀⠀⠄
⠤⣤⣤⣤⣤⣤⣤⣤⣤⣿⣿⠇⠀⢿⣿⣿⣷⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⠶⠶⠶⠶⠶⠶⠶⠶⠶⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒
⠀⠀⠘⢿⣿⣿⣟⠛⠛⠛⠛⠀⠀⠀⠛⠛⠛⠛⠋⠉⠉⠉
⠀⠀⠁⠀⠈⠛⣿⣿⣦
⠀⠀⠀⠀⠀⠀⠀⢹⣿⡿
⠀⠀⠀⠠⡧⠀⠀⣾⣿⠁⢀⣤⣾⣦⡀
⠀⠠⠀⠀⠀⠀⣸⣿⢇⣶⣿⠟⠙⠻⣿⣄
⠀⠀⠀⠀⠀⢠⣿⣿⠿⠋⠁⠀⠀⠀⠀⠉⠳⡄
⠀⠀⠀⠀⠀⡿⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈
""")

    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)
