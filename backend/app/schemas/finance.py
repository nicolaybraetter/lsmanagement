from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.finance import TransactionType, FinanceCategory


class FinanceCreate(BaseModel):
    type: TransactionType
    category: FinanceCategory
    amount: float
    description: str
    notes: Optional[str] = None
    date: datetime
    reference_number: Optional[str] = None
    field_id: Optional[int] = None
    machine_id: Optional[int] = None


class FinanceUpdate(FinanceCreate):
    type: Optional[TransactionType] = None
    category: Optional[FinanceCategory] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None


class FinanceOut(BaseModel):
    id: int
    farm_id: int
    type: TransactionType
    category: FinanceCategory
    amount: float
    description: str
    notes: Optional[str]
    date: datetime
    reference_number: Optional[str]
    field_id: Optional[int]
    machine_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
