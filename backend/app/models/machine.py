from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Text, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class MachineCategory(str, enum.Enum):
    tractor = "Traktor"
    harvester = "Mähdrescher"
    forage_harvester = "Feldhäcksler"
    seeder = "Sämaschine"
    sprayer = "Feldspritze"
    fertilizer = "Düngerstreuer"
    slurry = "Güllefass"
    manure = "Miststreuer"
    trailer = "Anhänger / Kipper"
    loader = "Radlader / Teleskoplader"
    mower = "Mähwerk / Schwader"
    baler = "Ballenpresse"
    plow = "Pflug"
    cultivator = "Grubber / Egge"
    transport = "Transporter / LKW"
    other = "Sonstiges"


class MachineStatus(str, enum.Enum):
    available = "verfügbar"
    in_use = "im Einsatz"
    maintenance = "Wartung"
    rented_out = "verliehen"
    broken = "defekt"
    sold = "verkauft"


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String(100), nullable=False)
    brand = Column(String(50))
    model = Column(String(100))
    license_plate = Column(String(20))
    year = Column(Integer)
    category = Column(Enum(MachineCategory), default=MachineCategory.other)
    status = Column(Enum(MachineStatus), default=MachineStatus.available)
    purchase_price = Column(Float, default=0)
    purchase_date = Column(DateTime(timezone=True))
    current_value = Column(Float, default=0)
    hourly_rental_rate = Column(Float, default=0)
    daily_rental_rate = Column(Float, default=0)
    operating_hours = Column(Float, default=0)
    notes = Column(Text)
    image_url = Column(String(255))
    is_available_for_rental = Column(Boolean, default=False)
    # Lending
    lent_to_farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)
    # Sale
    is_sold = Column(Boolean, default=False)
    sale_price = Column(Float, default=0)
    sold_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farm = relationship("Farm", back_populates="machines", foreign_keys=[farm_id])
    lent_to_farm = relationship("Farm", foreign_keys=[lent_to_farm_id])
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
