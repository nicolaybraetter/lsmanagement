from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class InvitationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class FarmInvitation(Base):
    __tablename__ = "farm_invitations"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    invitee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    inviter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), default="worker")
    message = Column(Text)
    status = Column(Enum(InvitationStatus), default=InvitationStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True))

    farm = relationship("Farm")
    invitee = relationship("User", foreign_keys=[invitee_id])
    inviter = relationship("User", foreign_keys=[inviter_id])
