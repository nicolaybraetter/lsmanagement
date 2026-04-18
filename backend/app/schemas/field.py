from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.field import FieldStatus


class FieldCreate(BaseModel):
    field_number: str
    name: Optional[str] = None
    area_ha: float
    status: FieldStatus = FieldStatus.fallow
    current_crop: Optional[str] = None
    soil_type: Optional[str] = None
    location_notes: Optional[str] = None
    purchase_price: Optional[float] = None
    lease_price_per_ha: Optional[float] = None
    is_owned: bool = True


class FieldUpdate(FieldCreate):
    field_number: Optional[str] = None
    area_ha: Optional[float] = None


class FieldOut(BaseModel):
    id: int
    farm_id: int
    field_number: str
    name: Optional[str]
    area_ha: float
    status: FieldStatus
    current_crop: Optional[str]
    soil_type: Optional[str]
    location_notes: Optional[str]
    purchase_price: Optional[float]
    lease_price_per_ha: Optional[float]
    is_owned: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CropRotationCreate(BaseModel):
    field_id: int
    year: int
    crop: str
    yield_amount: Optional[float] = None
    yield_unit: str = "t"
    notes: Optional[str] = None
    sowing_date: Optional[str] = None
    harvest_date: Optional[str] = None
    fertilizer_used: Optional[str] = None


class CropRotationOut(BaseModel):
    id: int
    field_id: int
    year: int
    crop: str
    yield_amount: Optional[float]
    yield_unit: str
    notes: Optional[str]
    sowing_date: Optional[str]
    harvest_date: Optional[str]
    fertilizer_used: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CropRotationPlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    crops: List[str]
    game_version: Optional[str] = None


class CropRotationPlanOut(BaseModel):
    id: int
    farm_id: int
    name: str
    description: Optional[str]
    crops: List[str]
    game_version: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
