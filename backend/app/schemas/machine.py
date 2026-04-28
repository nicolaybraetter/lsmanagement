from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.machine import MachineCategory, MachineStatus, MachineServiceType


class LendRequest(BaseModel):
    lent_to_farm_id: int


class SellRequest(BaseModel):
    sale_price: float


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
    license_plate: Optional[str] = None
    purchase_date: Optional[datetime] = None


class MachineUpdate(MachineCreate):
    name: Optional[str] = None
    status: Optional[MachineStatus] = None
    lent_to_farm_id: Optional[int] = None


class MachineOut(BaseModel):
    id: int
    farm_id: int
    name: str
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    category: MachineCategory
    status: MachineStatus
    purchase_price: float
    current_value: float
    hourly_rental_rate: float
    daily_rental_rate: float
    operating_hours: float
    notes: Optional[str] = None
    is_available_for_rental: bool
    license_plate: Optional[str] = None
    purchase_date: Optional[datetime] = None
    lent_to_farm_id: Optional[int] = None
    lent_to_farm_name: Optional[str] = None
    is_sold: bool = False
    sale_price: Optional[float] = None
    sold_at: Optional[datetime] = None
    created_at: datetime
    is_borrowed: bool = False
    owned_by_farm_name: Optional[str] = None

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


class MachineServiceCreate(BaseModel):
    type: MachineServiceType
    title: str
    description: Optional[str] = None
    cost: Optional[float] = 0
    service_date: datetime


class MachineServiceOut(BaseModel):
    id: int
    machine_id: int
    farm_id: int
    type: MachineServiceType
    title: str
    description: Optional[str]
    cost: float
    service_date: datetime
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
