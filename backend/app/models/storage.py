from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class StorageCategory(str, enum.Enum):
    fuel = "Kraftstoff"
    oil = "Öl & Schmierstoffe"
    seed = "Saatgut"
    fertilizer_mineral = "Mineraldünger"
    fertilizer_organic = "Organischer Dünger"
    pesticide = "Pflanzenschutzmittel"
    feed_hay = "Heu"
    feed_straw = "Stroh"
    feed_silage_grass = "Grassilage"
    feed_silage_corn = "Maissilage"
    feed_silage_wps = "GPS Silage"
    feed_grain = "Getreide als Futter"
    feed_concentrate = "Kraftfutter"
    silage_beet = "Rübenpressschnitzel"
    harvest_wheat = "Weizen Ernte"
    harvest_barley = "Gerste Ernte"
    harvest_rapeseed = "Raps Ernte"
    harvest_corn = "Mais Ernte"
    harvest_potato = "Kartoffel Ernte"
    harvest_sugar_beet = "Zuckerrüben Ernte"
    other = "Sonstiges"


class StorageItem(Base):
    __tablename__ = "storage_items"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(Enum(StorageCategory), nullable=False)
    current_quantity = Column(Float, default=0)
    unit = Column(String(20), default="t")
    capacity = Column(Float)
    location = Column(String(100))
    notes = Column(Text)
    min_stock_warning = Column(Float)
    price_per_unit = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farm = relationship("Farm", back_populates="storage_items")
    transactions = relationship("StorageTransaction", back_populates="storage_item")


class StorageTransaction(Base):
    __tablename__ = "storage_transactions"

    id = Column(Integer, primary_key=True, index=True)
    storage_item_id = Column(Integer, ForeignKey("storage_items.id"), nullable=False)
    transaction_type = Column(String(10), nullable=False)  # "in" or "out"
    quantity = Column(Float, nullable=False)
    price_per_unit = Column(Float)
    description = Column(String(255))
    date = Column(DateTime(timezone=True), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    storage_item = relationship("StorageItem", back_populates="transactions")
