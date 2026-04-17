from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.farm import MemberRole


class FarmCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    game_version: Optional[str] = "LS25"
    total_area: Optional[int] = 0


class FarmUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    game_version: Optional[str] = None
    total_area: Optional[int] = None


class FarmOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    location: Optional[str]
    game_version: str
    total_area: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FarmMemberOut(BaseModel):
    id: int
    farm_id: int
    user_id: int
    role: MemberRole
    joined_at: datetime
    username: Optional[str] = None
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class InviteMemberRequest(BaseModel):
    username: str
    role: MemberRole = MemberRole.worker
