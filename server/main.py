from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .core import ENGINE, seed_admin_user
from .models import *
from .routes import auth_router, user_router
from .routes import branch_router, table_router
from .routes import category_router, product_router, size_router, extra_router
from .routes import order_router, history_router, menu_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=ENGINE)
    seed_admin_user()
    yield


app = FastAPI(
    title="Point of Sale API",
    description="A robust API for managing cashiers, inventory, and sales orders.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(branch_router, prefix="/api/v1")
app.include_router(table_router, prefix="/api/v1")
app.include_router(category_router, prefix="/api/v1")
app.include_router(product_router, prefix="/api/v1")
app.include_router(size_router, prefix="/api/v1")
app.include_router(extra_router, prefix="/api/v1")
app.include_router(order_router, prefix="/api/v1")
app.include_router(history_router, prefix="/api/v1")
app.include_router(menu_router, prefix="/api/v1")


@app.get("/api/health", tags=["Root"])
def root_check():
    return {
        "status": "online",
        "message": "Welcome to the Point of Sale API. Visit /docs for the Swagger UI.",
    }


BASE_DIR = Path(__file__).resolve().parent.parent
GUI_DIR = BASE_DIR / "gui"

app.mount("/", StaticFiles(directory=GUI_DIR, html=True), name="gui")


if __name__ == "__main__":
    import uvicorn

    print(r"""
  _____ _                        _     _                
 | ____| | _____   _____ _ __   | |   (_)_   _____  ___ 
 |  _| | |/ _ \ \ / / _ \ '_ \  | |   | \ \ / / _ \/ __|
 | |___| |  __/\ V /  __/ | | | | |___| |\ V /  __/\__ \
 |_____|_|\___| \_/ \___|_| |_| |_____|_| \_/ \___||___/

""")

    uvicorn.run("server.main:app", host="127.0.0.1", port=8000, reload=True)
