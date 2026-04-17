from contextlib import asynccontextmanager
from fastapi import FastAPI
from .helpers.config import ASYNC_ENGINE
from .routes.management import user_management_router
from .routes.authentication import auth_router
from .models import *


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with ASYNC_ENGINE.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await ASYNC_ENGINE.dispose()


app = FastAPI(
    title="NancysGun",
    description="A robust API for managing cashiers, inventory, and sales orders.",
    version="1.0.0",
    lifespan=lifespan,
)


app.include_router(user_management_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")


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
