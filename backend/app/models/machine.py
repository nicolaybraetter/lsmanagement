from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Text, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class MachineCategory(str, enum.Enum):
    tractor = "Traktor"
    harvester = "Mähdrescher"
    seeder = "Sämaschine"
    sprayer = "Feldspritze"
    fertilizer = "Düngerstreuer"
    trailer = "Anhänger"
    loader = "Lader"
    mower = "Mähwerk"
    baler = "Ballenpresse"
    plow = "Pflug"
    cultivator = "Grubber"
    other = "Sonstiges"


class MachineStatus(str, enum.Enum):
    available = "verfügbar"
    in_use = "im Einsatz"
    maintenance = "Wartung"
    rented_out = "verliehen"
    broken = "defekt"


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String(100), nullable=False)
    brand = Column(String(50))
    model = Column(String(100))
    year = Column(Integer)
    category = Column(Enum(MachineCategory), default=MachineCategory.other)
    status = Column(Enum(MachineStatus), default=MachineStatus.available)
    purchase_price = Column(Float, default=0)
    current_value = Column(Float, default=0)
    hourly_rental_rate = Column(Float, default=0)
    daily_rental_rate = Column(Float, default=0)
    operating_hours = Column(Float, default=0)
    notes = Column(Text)
    image_url = Column(String(255))
    is_available_for_rental = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farm = relationship("Farm", back_populates="machines")
    rentals = relationship("MachineRental", back_populates="machine")


class MachineRental(Base):
    __tablename__ = "machine_rentals"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    renter_name = Column(String(100), nullable=False)
    renter_farm = Column(String(100))
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True))
    total_hours = Column(Float)
    total_cost = Column(Float)
    notes = Column(Text)
    is_returned = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    machine = relationship("Machine", back_populates="rentals")
