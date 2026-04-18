from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
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

    comments = relationship("SupportComment", back_populates="support_message", cascade="all, delete-orphan", lazy="joined")


class SupportComment(Base):
    __tablename__ = "support_comments"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("support_messages.id"), nullable=False)
    author_email = Column(String(255), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    support_message = relationship("SupportMessage", back_populates="comments")
