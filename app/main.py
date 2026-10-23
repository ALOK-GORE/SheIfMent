from fastapi import FastAPI
from app import models  # noqa: F401, ensures every model is registered with SQLAlchemy
from app.routers.auth import router as auth_router
from app.routers.categories import router as categories_router
from app.routers.products import router as products_router
from app.routers.tags import router as tags_router

app = FastAPI(
    title="SheIfMent Inventory API",
    description="Inventory management API built with FastAPI, SQLAlchemy, and PostgreSQL.",
    version="1.0.0",
)

app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(products_router)
app.include_router(tags_router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
