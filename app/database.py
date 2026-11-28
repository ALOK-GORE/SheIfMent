import os
from functools import lru_cache

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is missing. Set it in your environment or .env file.")

DATABASE_URL = normalize_database_url(DATABASE_URL)

Base = declarative_base()
SessionLocal = sessionmaker(autoflush=False, autocommit=False)


@lru_cache(maxsize=1)
def get_engine():
    """Create the database engine only when a real connection is needed."""
    options = {"pool_pre_ping": True}
    if DATABASE_URL.startswith("sqlite"):
        options["connect_args"] = {"check_same_thread": False}
    return create_engine(DATABASE_URL, **options)


def get_db():
    db = SessionLocal(bind=get_engine())
    try:
        yield db
    finally:
        db.close()
