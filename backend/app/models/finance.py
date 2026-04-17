from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class TransactionType(str, enum.Enum):
    income = "Einnahme"
    expense = "Ausgabe"


class FinanceCategory(str, enum.Enum):
    machine_purchase = "Maschinenkauf"
    machine_rental = "Maschinenverleih"
    fuel = "Kraftstoff"
    seed = "Saatgut"
    fertilizer = "Düngemittel"
    pesticide = "Pflanzenschutz"
    harvest_sale = "Ernte Verkauf"
    animal_sale = "Tierverkauf"
    animal_purchase = "Tierkauf"
    land_lease = "Pacht"
    land_purchase = "Grunderwerb"
    repair = "Reparatur"
    contract_work = "Lohnarbeit"
    subsidy = "Förderung"
    feed = "Futtermittel"
    biogas = "Biogasanlage"
    other_income = "Sonstige Einnahme"
    other_expense = "Sonstige Ausgabe"


class FinanceEntry(Base):
    __tablename__ = "finance_entries"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    category = Column(Enum(FinanceCategory), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=False)
    notes = Column(Text)
    date = Column(DateTime(timezone=True), nullable=False)
    reference_number = Column(String(50))
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farm = relationship("Farm", back_populates="finance_entries")
