from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.animal import Stable, Animal
from app.models.farm import FarmMember
from app.schemas.animal import StableCreate, StableUpdate, StableOut, AnimalCreate, AnimalOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/farms/{farm_id}/animals", tags=["animals"])


def check_access(farm_id: int, user: User, db: Session):
    m = db.query(FarmMember).filter(FarmMember.farm_id == farm_id, FarmMember.user_id == user.id, FarmMember.is_active == True).first()
    if not m:
        raise HTTPException(status_code=403, detail="Kein Zugriff")


@router.get("/stables", response_model=List[StableOut])
def list_stables(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    return db.query(Stable).filter(Stable.farm_id == farm_id, Stable.is_active == True).all()


@router.post("/stables", response_model=StableOut)
def create_stable(farm_id: int, data: StableCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    stable = Stable(**data.model_dump(), farm_id=farm_id)
    db.add(stable)
    db.commit()
    db.refresh(stable)
    return stable


@router.put("/stables/{stable_id}", response_model=StableOut)
def update_stable(farm_id: int, stable_id: int, data: StableUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    stable = db.query(Stable).filter(Stable.id == stable_id, Stable.farm_id == farm_id).first()
    if not stable:
        raise HTTPException(status_code=404, detail="Stall nicht gefunden")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(stable, k, v)
    db.commit()
    db.refresh(stable)
    return stable


@router.delete("/stables/{stable_id}")
def delete_stable(farm_id: int, stable_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    stable = db.query(Stable).filter(Stable.id == stable_id, Stable.farm_id == farm_id).first()
    if not stable:
        raise HTTPException(status_code=404, detail="Stall nicht gefunden")
    stable.is_active = False
    db.commit()
    return {"message": "Stall archiviert"}


@router.get("/stables/{stable_id}/animals", response_model=List[AnimalOut])
def list_animals(farm_id: int, stable_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    return db.query(Animal).filter(Animal.stable_id == stable_id, Animal.is_active == True).all()


@router.post("/stables/{stable_id}/animals", response_model=AnimalOut)
def create_animal(farm_id: int, stable_id: int, data: AnimalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    animal = Animal(**data.model_dump(exclude={'stable_id'}), stable_id=stable_id)
    db.add(animal)
    db.commit()
    db.refresh(animal)
    return animal


@router.delete("/stables/{stable_id}/animals/{animal_id}")
def remove_animal(farm_id: int, stable_id: int, animal_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    animal = db.query(Animal).filter(Animal.id == animal_id, Animal.stable_id == stable_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Tier nicht gefunden")
    animal.is_active = False
    db.commit()
    return {"message": "Tier entfernt"}
