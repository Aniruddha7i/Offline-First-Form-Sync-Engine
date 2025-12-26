from sqlalchemy import Column, String, Integer, DateTime, Boolean
from database import Base
import datetime

class ItemDB(Base):
    __tablename__ = "items"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    updatedAt = Column(String)
    version = Column(Integer, default=1)
    deleted = Column(Boolean, default=False)

class ProcessedOpDB(Base):
    __tablename__ = "processed_ops"
    opId = Column(String, primary_key=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)