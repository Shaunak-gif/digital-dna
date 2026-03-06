"""
Database initialization and models using SQLAlchemy async.
"""
import os
import json
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, Boolean
from sqlalchemy import text

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://digitaldna:digitaldna@localhost:5432/digitaldna"
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class BehavioralSession(Base):
    __tablename__ = "behavioral_sessions"

    session_id = Column(String(36), primary_key=True)
    form_id = Column(String(100))
    session_duration = Column(Integer)  # ms
    authenticity_score = Column(Float)
    anomaly_probability = Column(Float)
    risk_level = Column(String(10))  # LOW, MEDIUM, HIGH
    reason = Column(Text)

    # Feature columns
    avg_iki = Column(Float)           # Average inter-keystroke interval
    iki_variance = Column(Float)      # Variance in IKI (low = bot-like)
    backspace_rate = Column(Float)    # Backspace / total keys
    paste_count = Column(Integer)
    copy_count = Column(Integer)
    edit_bursts = Column(Integer)
    mouse_naturalness = Column(Float)
    typing_naturalness = Column(Float)
    total_keystrokes = Column(Integer)

    raw_events = Column(Text)         # JSON of all events for audit
    is_flagged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class EventBatch(Base):
    __tablename__ = "event_batches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(36))
    batch_data = Column(Text)  # JSON
    received_at = Column(DateTime, default=datetime.utcnow)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created.")
