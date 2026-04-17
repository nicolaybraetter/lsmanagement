from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.invoice import InvoiceStatus, InvoiceItemType


class InvoiceItemCreate(BaseModel):
    item_type: InvoiceItemType = InvoiceItemType.custom
    description: str
    quantity: float
    unit: str = "ha"
    unit_price: float
    field_number: Optional[str] = None


class InvoiceItemOut(BaseModel):
    id: int
    invoice_id: int
    item_type: InvoiceItemType
    description: str
    quantity: float
    unit: str
    unit_price: float
    total: float
    field_number: Optional[str]

    class Config:
        from_attributes = True


class InvoiceCreate(BaseModel):
    receiver_farm_id: int
    issue_date: datetime
    due_date: datetime
    tax_rate: float = 19.0
    notes: Optional[str] = None
    items: List[InvoiceItemCreate]


class InvoiceUpdate(BaseModel):
    due_date: Optional[datetime] = None
    tax_rate: Optional[float] = None
    notes: Optional[str] = None
    items: Optional[List[InvoiceItemCreate]] = None


class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    sender_farm_id: int
    receiver_farm_id: int
    status: InvoiceStatus
    issue_date: datetime
    due_date: datetime
    paid_date: Optional[datetime]
    total_net: float
    tax_rate: float
    total_gross: float
    notes: Optional[str]
    created_by: int
    created_at: datetime
    items: List[InvoiceItemOut] = []
    sender_farm_name: Optional[str] = None
    receiver_farm_name: Optional[str] = None

    class Config:
        from_attributes = True


class FarmCapitalSet(BaseModel):
    starting_capital: float
    current_balance: Optional[float] = None


class FarmCapitalOut(BaseModel):
    id: int
    farm_id: int
    starting_capital: float
    current_balance: float
    updated_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
