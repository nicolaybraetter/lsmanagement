from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class AnimalType(str, enum.Enum):
    cattle_dairy = "Milchkuh"
    cattle_beef = "Fleischrind"
    pig = "Schwein"
    sheep = "Schaf"
    chicken = "Huhn"
    horse = "Pferd"
    goat = "Ziege"
    other = "Sonstiges"


class StableType(str, enum.Enum):
    cowshed = "Kuhstall"
    pigsty = "Schweinestall"
    sheepfold = "Schafstall"
    chicken_coop = "Hühnerstall"
    horse_stable = "Pferdestall"
    mixed = "Gemischter Stall"


class Stable(Base):
    __tablename__ = "stables"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String(100), nullable=False)
    stable_type = Column(Enum(StableType), nullable=False)
    capacity = Column(Integer, default=0)
    location_notes = Column(Text)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farm = relationship("Farm", back_populates="stables")
    animals = relationship("Animal", back_populates="stable")


class Animal(Base):
    __tablename__ = "animals"

    id = Column(Integer, primary_key=True, index=True)
    stable_id = Column(Integer, ForeignKey("stables.id"), nullable=False)
    animal_type = Column(Enum(AnimalType), nullable=False)
    name = Column(String(50))
    ear_tag = Column(String(50), unique=True)
    birth_date = Column(String(20))
    weight = Column(Float)
    purchase_price = Column(Float)
    purchase_date = Column(String(20))
    daily_milk_yield = Column(Float)
    daily_feed_requirement = Column(Float)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    stable = relationship("Stable", back_populates="animals")
