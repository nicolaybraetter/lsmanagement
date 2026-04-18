from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Text, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import json
from app.database import Base


class FieldStatus(str, enum.Enum):
    fallow = "Brache"
    prepared = "vorbereitet"
    sown = "gesät"
    growing = "wächst"
    fertilized = "gedüngt"
    ready = "erntereif"
    harvested = "geerntet"


class CropType(str, enum.Enum):
    # Gräser & Futter (LS22 & LS25)
    grass = "Gras"
    clover = "Klee"
    silage_corn = "Silomais"
    # Getreide (LS22 & LS25)
    corn = "Mais"
    wheat = "Weizen"
    barley = "Gerste"
    oat = "Hafer"
    rye = "Roggen"
    triticale = "Triticale"
    sorghum = "Sorghum"
    # Ölfrüchte (LS22 & LS25)
    rapeseed = "Raps"
    sunflower = "Sonnenblume"
    soy = "Soja"
    # Hackfrüchte & Gemüse (LS22 & LS25)
    sugar_beet = "Zuckerrübe"
    potato = "Kartoffel"
    onion = "Zwiebel"
    carrot = "Karotten"
    parsnip = "Pastinaken"
    red_beet = "Rote Bete"
    # Sonderkulturen (LS22 & LS25)
    cotton = "Baumwolle"
    sugarcane = "Zuckerrohr"
    grapes = "Weintrauben"
    olives = "Oliven"
    poplar = "Pappel"
    oilseed_radish = "Ölrettich"
    # Neu in LS25
    spinach = "Spinat"
    peas = "Erbsen"
    green_beans = "Grüne Bohnen"
    rice = "Reis"
    long_grain_rice = "Langkornreis"
    # Sonstiges
    other = "Sonstiges"


class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    field_number = Column(String(20), nullable=False)
    name = Column(String(100))
    area_ha = Column(Float, nullable=False)
    status = Column(Enum(FieldStatus), default=FieldStatus.fallow)
    current_crop = Column(String(50))
    soil_type = Column(String(50))
    location_notes = Column(Text)
    purchase_price = Column(Float)
    lease_price_per_ha = Column(Float)
    is_owned = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farm = relationship("Farm", back_populates="fields")
    crop_rotations = relationship("CropRotationEntry", back_populates="field")


class CropRotationEntry(Base):
    __tablename__ = "crop_rotation_entries"

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    year = Column(Integer, nullable=False)
    crop = Column(String(50), nullable=False)
    yield_amount = Column(Float)
    yield_unit = Column(String(20), default="t")
    notes = Column(Text)
    sowing_date = Column(String(20))
    harvest_date = Column(String(20))
    fertilizer_used = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    field = relationship("Field", back_populates="crop_rotations")


class CropRotationPlan(Base):
    __tablename__ = "crop_rotation_plans"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    crops_json = Column(Text, nullable=False)
    game_version = Column(String(10))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def crops(self):
        return json.loads(self.crops_json) if self.crops_json else []
