from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class BiogasPlant(Base):
    __tablename__ = "biogas_plants"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    capacity_kw = Column(Float)
    daily_gas_production_m3 = Column(Float)
    annual_energy_kwh = Column(Float)
    feed_mix_notes = Column(Text)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    installation_date = Column(String(20))
    last_maintenance = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farm = relationship("Farm", back_populates="biogas_plant")
    feed_entries = relationship("BiogasFeedEntry", back_populates="plant")


class BiogasFeedEntry(Base):
    __tablename__ = "biogas_feed_entries"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("biogas_plants.id"), nullable=False)
    feed_type = Column(String(100), nullable=False)
    quantity_t = Column(Float, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    gas_yield_m3 = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plant = relationship("BiogasPlant", back_populates="feed_entries")
