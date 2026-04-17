from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.storage import StorageCategory


class StorageItemCreate(BaseModel):
    name: str
    category: StorageCategory
    current_quantity: float = 0
    unit: str = "t"
    capacity: Optional[float] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    min_stock_warning: Optional[float] = None
    price_per_unit: Optional[float] = None


class StorageItemUpdate(StorageItemCreate):
    name: Optional[str] = None
    category: Optional[StorageCategory] = None


class StorageItemOut(BaseModel):
    id: int
    farm_id: int
    name: str
    category: StorageCategory
    current_quantity: float
    unit: str
    capacity: Optional[float]
    location: Optional[str]
    notes: Optional[str]
    min_stock_warning: Optional[float]
    price_per_unit: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class StorageTransactionCreate(BaseModel):
    storage_item_id: int
    transaction_type: str
    quantity: float
    price_per_unit: Optional[float] = None
    description: Optional[str] = None
    date: datetime


class StorageTransactionOut(BaseModel):
    id: int
    storage_item_id: int
    transaction_type: str
    quantity: float
    price_per_unit: Optional[float]
    description: Optional[str]
    date: datetime
    created_at: datetime

    class Config:
        from_attributes = True
