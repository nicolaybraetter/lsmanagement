from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BiogasPlantCreate(BaseModel):
    name: str
    capacity_kw: Optional[float] = None
    daily_gas_production_m3: Optional[float] = None
    annual_energy_kwh: Optional[float] = None
    feed_mix_notes: Optional[str] = None
    notes: Optional[str] = None
    installation_date: Optional[str] = None
    last_maintenance: Optional[str] = None


class BiogasPlantOut(BaseModel):
    id: int
    farm_id: int
    name: str
    capacity_kw: Optional[float]
    daily_gas_production_m3: Optional[float]
    annual_energy_kwh: Optional[float]
    feed_mix_notes: Optional[str]
    notes: Optional[str]
    is_active: bool
    installation_date: Optional[str]
    last_maintenance: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class BiogasFeedCreate(BaseModel):
    plant_id: int
    feed_type: str
    quantity_t: float
    date: datetime
    gas_yield_m3: Optional[float] = None
    notes: Optional[str] = None


class BiogasFeedOut(BaseModel):
    id: int
    plant_id: int
    feed_type: str
    quantity_t: float
    date: datetime
    gas_yield_m3: Optional[float]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
