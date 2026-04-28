from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.animal import AnimalType, StableType


class StableCreate(BaseModel):
    name: str
    stable_type: StableType
    capacity: int = 0
    location_notes: Optional[str] = None
    notes: Optional[str] = None


class StableUpdate(StableCreate):
    name: Optional[str] = None
    stable_type: Optional[StableType] = None


class StableOut(BaseModel):
    id: int
    farm_id: int
    name: str
    stable_type: StableType
    capacity: int
    location_notes: Optional[str]
    notes: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AnimalCreate(BaseModel):
    stable_id: Optional[int] = None
    animal_type: AnimalType
    name: Optional[str] = None
    ear_tag: Optional[str] = None
    birth_date: Optional[str] = None
    weight: Optional[float] = None
    purchase_price: Optional[float] = None
    purchase_date: Optional[str] = None
    daily_milk_yield: Optional[float] = None
    daily_feed_requirement: Optional[float] = None
    notes: Optional[str] = None


class AnimalOut(BaseModel):
    id: int
    stable_id: int
    animal_type: AnimalType
    name: Optional[str]
    ear_tag: Optional[str]
    birth_date: Optional[str]
    weight: Optional[float]
    purchase_price: Optional[float]
    purchase_date: Optional[str]
    daily_milk_yield: Optional[float]
    daily_feed_requirement: Optional[float]
    notes: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
