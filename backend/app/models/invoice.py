from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class InvoiceStatus(str, enum.Enum):
    draft = "Entwurf"
    sent = "Gestellt"
    viewed = "Gesehen"
    paid = "Bezahlt"
    overdue = "Überfällig"
    cancelled = "Storniert"


class InvoiceItemType(str, enum.Enum):
    labor_plowing = "Pflügen"
    labor_cultivating = "Grubbern"
    labor_seeding = "Säen"
    labor_spraying = "Spritzen"
    labor_fertilizer = "Düngergabe"
    labor_slurry = "Gülleausbringung"
    labor_mowing = "Mähen"
    labor_silage = "Feldhäckseln"
    labor_harvesting = "Mähdrescherarbeiten"
    labor_baling = "Pressen"
    labor_wrapping = "Wickeln"
    labor_sugarbeet = "Zuckerrübenernte"
    labor_potato = "Kartoffelernte"
    rental_tractor_small = "Schlepper 60-80 PS"
    rental_tractor_medium = "Schlepper 100-130 PS"
    rental_tractor_large = "Schlepper 180+ PS"
    rental_combine = "Mähdrescher"
    rental_forager = "Feldhäcksler"
    rental_loader = "Teleskoplader"
    transport = "Transport"
    custom = "Sonstige Leistung"


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(30), unique=True, nullable=False)
    sender_farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    receiver_farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.draft)
    issue_date = Column(DateTime(timezone=True), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    paid_date = Column(DateTime(timezone=True), nullable=True)
    total_net = Column(Float, default=0)
    tax_rate = Column(Float, default=19.0)
    total_gross = Column(Float, default=0)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    sender_farm = relationship("Farm", foreign_keys=[sender_farm_id])
    receiver_farm = relationship("Farm", foreign_keys=[receiver_farm_id])
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    item_type = Column(Enum(InvoiceItemType), default=InvoiceItemType.custom)
    description = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), default="ha")
    unit_price = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    field_number = Column(String(20))

    invoice = relationship("Invoice", back_populates="items")


class FarmCapital(Base):
    __tablename__ = "farm_capitals"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), unique=True, nullable=False)
    starting_capital = Column(Float, default=0)
    current_balance = Column(Float, default=0)
    set_by = Column(Integer, ForeignKey("users.id"))
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farm = relationship("Farm")
