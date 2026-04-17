from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.machine import Machine, MachineRental, MachineStatus
from app.models.farm import FarmMember
from app.schemas.machine import MachineCreate, MachineUpdate, MachineOut, MachineRentalCreate, MachineRentalOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/farms/{farm_id}/machines", tags=["machines"])


def check_access(farm_id: int, user: User, db: Session):
    m = db.query(FarmMember).filter(FarmMember.farm_id == farm_id, FarmMember.user_id == user.id, FarmMember.is_active == True).first()
    if not m:
        raise HTTPException(status_code=403, detail="Kein Zugriff")


@router.get("", response_model=List[MachineOut])
def list_machines(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    return db.query(Machine).filter(Machine.farm_id == farm_id).all()


@router.post("", response_model=MachineOut)
def create_machine(farm_id: int, data: MachineCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machine = Machine(**data.model_dump(), farm_id=farm_id)
    db.add(machine)
    db.commit()
    db.refresh(machine)
    return machine


@router.put("/{machine_id}", response_model=MachineOut)
def update_machine(farm_id: int, machine_id: int, data: MachineUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Maschine nicht gefunden")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(machine, field, value)
    db.commit()
    db.refresh(machine)
    return machine


@router.delete("/{machine_id}")
def delete_machine(farm_id: int, machine_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Maschine nicht gefunden")
    db.delete(machine)
    db.commit()
    return {"message": "Maschine gelöscht"}


@router.post("/{machine_id}/rentals", response_model=MachineRentalOut)
def create_rental(farm_id: int, machine_id: int, data: MachineRentalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Maschine nicht gefunden")
    rental_data = data.model_dump()
    rental_data["machine_id"] = machine_id
    rental = MachineRental(**rental_data)
    machine.status = MachineStatus.rented_out
    db.add(rental)
    db.commit()
    db.refresh(rental)
    return rental


@router.get("/{machine_id}/rentals", response_model=List[MachineRentalOut])
def list_rentals(farm_id: int, machine_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    return db.query(MachineRental).filter(MachineRental.machine_id == machine_id).all()


@router.put("/{machine_id}/rentals/{rental_id}/return")
def return_rental(farm_id: int, machine_id: int, rental_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    rental = db.query(MachineRental).filter(MachineRental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Verleih nicht gefunden")
    rental.is_returned = True
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if machine:
        machine.status = MachineStatus.available
    db.commit()
    return {"message": "Maschine zurückgegeben"}
