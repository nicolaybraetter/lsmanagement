from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class MemberRole(str, enum.Enum):
    owner = "owner"
    manager = "manager"
    worker = "worker"
    viewer = "viewer"


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    location = Column(String(200))
    game_version = Column(String(10), default="LS25")
    total_area = Column(Integer, default=0)
    logo_url = Column(String(255))
    is_active = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="owned_farms", foreign_keys=[owner_id])
    members = relationship("FarmMember", back_populates="farm")
    machines = relationship("Machine", back_populates="farm", foreign_keys="Machine.farm_id")
    fields = relationship("Field", back_populates="farm")
    finance_entries = relationship("FinanceEntry", back_populates="farm")
    storage_items = relationship("StorageItem", back_populates="farm")
    stables = relationship("Stable", back_populates="farm")
    biogas_plant = relationship("BiogasPlant", back_populates="farm", uselist=False)
    todo_boards = relationship("TodoBoard", back_populates="farm")


class FarmMember(Base):
    __tablename__ = "farm_members"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(Enum(MemberRole), default=MemberRole.worker)
    invited_by = Column(Integer, ForeignKey("users.id"))
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    farm = relationship("Farm", back_populates="members")
    user = relationship("User", back_populates="farm_memberships", foreign_keys=[user_id])
