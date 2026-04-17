from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.biogas import BiogasPlant, BiogasFeedEntry
from app.models.farm import FarmMember
from app.schemas.biogas import BiogasPlantCreate, BiogasPlantOut, BiogasFeedCreate, BiogasFeedOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/farms/{farm_id}/biogas", tags=["biogas"])


def check_access(farm_id: int, user: User, db: Session):
    m = db.query(FarmMember).filter(FarmMember.farm_id == farm_id, FarmMember.user_id == user.id, FarmMember.is_active == True).first()
    if not m:
        raise HTTPException(status_code=403, detail="Kein Zugriff")


@router.get("", response_model=BiogasPlantOut)
def get_plant(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    plant = db.query(BiogasPlant).filter(BiogasPlant.farm_id == farm_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Keine Biogasanlage eingerichtet")
    return plant


@router.post("", response_model=BiogasPlantOut)
def create_plant(farm_id: int, data: BiogasPlantCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    existing = db.query(BiogasPlant).filter(BiogasPlant.farm_id == farm_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Biogasanlage bereits vorhanden")
    plant = BiogasPlant(**data.model_dump(), farm_id=farm_id)
    db.add(plant)
    db.commit()
    db.refresh(plant)
    return plant


@router.put("/{plant_id}", response_model=BiogasPlantOut)
def update_plant(farm_id: int, plant_id: int, data: BiogasPlantCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    plant = db.query(BiogasPlant).filter(BiogasPlant.id == plant_id, BiogasPlant.farm_id == farm_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Biogasanlage nicht gefunden")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(plant, k, v)
    db.commit()
    db.refresh(plant)
    return plant


@router.post("/{plant_id}/feed", response_model=BiogasFeedOut)
def add_feed(farm_id: int, plant_id: int, data: BiogasFeedCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    feed_data = data.model_dump()
    feed_data["plant_id"] = plant_id
    entry = BiogasFeedEntry(**feed_data)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/{plant_id}/feed", response_model=List[BiogasFeedOut])
def list_feed(farm_id: int, plant_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    return db.query(BiogasFeedEntry).filter(BiogasFeedEntry.plant_id == plant_id).order_by(BiogasFeedEntry.date.desc()).all()
