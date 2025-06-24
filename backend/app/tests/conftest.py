import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from .. import database

# Ensure environment variables are set before any application modules are imported
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret")

# Override database engine with in-memory SQLite that persists for the whole session
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
database.engine = engine
database.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
database.Base.metadata.create_all(bind=engine)

@pytest.fixture(autouse=True)
def apply_test_env(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    yield
