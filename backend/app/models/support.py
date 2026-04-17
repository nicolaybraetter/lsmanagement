from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base


class SupportMessage(Base):
    __tablename__ = "support_messages"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    subject = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_reviewed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
