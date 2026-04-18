from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    avatar_url = Column(String(255))
    bio = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_seen = Column(DateTime(timezone=True), nullable=True)

    farm_memberships = relationship("FarmMember", back_populates="user", foreign_keys="FarmMember.user_id")
    owned_farms = relationship("Farm", back_populates="owner", foreign_keys="Farm.owner_id")
    assigned_todos = relationship("TodoTask", back_populates="assignee", foreign_keys="TodoTask.assignee_id")
    created_todos = relationship("TodoTask", back_populates="creator", foreign_keys="TodoTask.creator_id")
