from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.field import Field, CropRotationEntry
from app.models.farm import FarmMember
from app.schemas.field import FieldCreate, FieldUpdate, FieldOut, CropRotationCreate, CropRotationOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/farms/{farm_id}/fields", tags=["fields"])


def check_access(farm_id: int, user: User, db: Session):
    m = db.query(FarmMember).filter(FarmMember.farm_id == farm_id, FarmMember.user_id == user.id, FarmMember.is_active == True).first()
    if not m:
        raise HTTPException(status_code=403, detail="Kein Zugriff")


@router.get("", response_model=List[FieldOut])
def list_fields(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    return db.query(Field).filter(Field.farm_id == farm_id).order_by(Field.field_number).all()


@router.post("", response_model=FieldOut)
def create_field(farm_id: int, data: FieldCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    field = Field(**data.model_dump(), farm_id=farm_id)
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


@router.put("/{field_id}", response_model=FieldOut)
def update_field(farm_id: int, field_id: int, data: FieldUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    field = db.query(Field).filter(Field.id == field_id, Field.farm_id == farm_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Feld nicht gefunden")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(field, k, v)
    db.commit()
    db.refresh(field)
    return field


@router.delete("/{field_id}")
def delete_field(farm_id: int, field_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    field = db.query(Field).filter(Field.id == field_id, Field.farm_id == farm_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Feld nicht gefunden")
    db.delete(field)
    db.commit()
    return {"message": "Feld gelöscht"}


@router.get("/{field_id}/crop-rotation", response_model=List[CropRotationOut])
def get_crop_rotation(farm_id: int, field_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    return db.query(CropRotationEntry).filter(CropRotationEntry.field_id == field_id).order_by(CropRotationEntry.year.desc()).all()


@router.post("/{field_id}/crop-rotation", response_model=CropRotationOut)
def add_crop_rotation(farm_id: int, field_id: int, data: CropRotationCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    entry = CropRotationEntry(**data.model_dump(), field_id=field_id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
