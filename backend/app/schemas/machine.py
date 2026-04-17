from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.machine import MachineCategory, MachineStatus


class MachineCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    category: MachineCategory = MachineCategory.other
    purchase_price: Optional[float] = 0
    current_value: Optional[float] = 0
    hourly_rental_rate: Optional[float] = 0
    daily_rental_rate: Optional[float] = 0
    operating_hours: Optional[float] = 0
    notes: Optional[str] = None
    is_available_for_rental: Optional[bool] = False


class MachineUpdate(MachineCreate):
    name: Optional[str] = None
    status: Optional[MachineStatus] = None


class MachineOut(BaseModel):
    id: int
    farm_id: int
    name: str
    brand: Optional[str]
    model: Optional[str]
    year: Optional[int]
    category: MachineCategory
    status: MachineStatus
    purchase_price: float
    current_value: float
    hourly_rental_rate: float
    daily_rental_rate: float
    operating_hours: float
    notes: Optional[str]
    is_available_for_rental: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MachineRentalCreate(BaseModel):
    machine_id: int
    renter_name: str
    renter_farm: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    total_hours: Optional[float] = None
    total_cost: Optional[float] = None
    notes: Optional[str] = None


class MachineRentalOut(BaseModel):
    id: int
    machine_id: int
    renter_name: str
    renter_farm: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    total_hours: Optional[float]
    total_cost: Optional[float]
    notes: Optional[str]
    is_returned: bool
    created_at: datetime

    class Config:
        from_attributes = True
