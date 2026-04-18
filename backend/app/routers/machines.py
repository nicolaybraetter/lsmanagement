from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.machine import Machine, MachineRental, MachineStatus
from app.models.farm import Farm, FarmMember
from app.models.finance import FinanceEntry, TransactionType, FinanceCategory
from app.models.invoice import FarmCapital
from app.schemas.machine import (
    MachineCreate, MachineUpdate, MachineOut, MachineRentalCreate,
    MachineRentalOut, LendRequest, SellRequest,
)
from pydantic import BaseModel


class LendLohnhofRequest(BaseModel):
    lohnhof_id: int
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/farms/{farm_id}/machines", tags=["machines"])


def check_access(farm_id: int, user: User, db: Session):
    m = db.query(FarmMember).filter(
        FarmMember.farm_id == farm_id,
        FarmMember.user_id == user.id,
        FarmMember.is_active == True,
    ).first()
    if not m:
        raise HTTPException(status_code=403, detail="Kein Zugriff")


def _machine_out(machine: Machine, db: Session) -> dict:
    data = {c.name: getattr(machine, c.name) for c in machine.__table__.columns}
    lent_farm = db.query(Farm).filter(Farm.id == machine.lent_to_farm_id).first() if machine.lent_to_farm_id else None
    lent_lohnhof_id = getattr(machine, "lent_to_lohnhof_id", None)
    if lent_farm:
        data["lent_to_farm_name"] = lent_farm.name
    elif lent_lohnhof_id:
        from app.models.lohnhof import LohnhofPartner
        lohnhof = db.query(LohnhofPartner).filter(LohnhofPartner.id == lent_lohnhof_id).first()
        data["lent_to_farm_name"] = lohnhof.name if lohnhof else None
    else:
        data["lent_to_farm_name"] = None
    return data


@router.get("", response_model=List[MachineOut])
def list_machines(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machines = db.query(Machine).filter(Machine.farm_id == farm_id).all()
    return [_machine_out(m, db) for m in machines]


@router.post("", response_model=MachineOut)
def create_machine(farm_id: int, data: MachineCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    payload = data.model_dump()
    machine = Machine(**payload, farm_id=farm_id)
    db.add(machine)
    db.flush()
    if data.purchase_price and data.purchase_price > 0:
        db.add(FinanceEntry(
            farm_id=farm_id,
            type=TransactionType.expense,
            category=FinanceCategory.machine_purchase,
            amount=data.purchase_price,
            description=f"Fahrzeugkauf: {data.name}",
            date=data.purchase_date or datetime.utcnow(),
            machine_id=machine.id,
            created_by=user.id,
        ))
        capital = db.query(FarmCapital).filter(FarmCapital.farm_id == farm_id).first()
        if capital:
            capital.current_balance -= data.purchase_price
    db.commit()
    db.refresh(machine)
    return _machine_out(machine, db)


@router.put("/{machine_id}", response_model=MachineOut)
def update_machine(farm_id: int, machine_id: int, data: MachineUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(machine, field, value)
    db.commit()
    db.refresh(machine)
    return _machine_out(machine, db)


@router.delete("/{machine_id}")
def delete_machine(farm_id: int, machine_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    db.delete(machine)
    db.commit()
    return {"message": "Fahrzeug gelöscht"}


@router.post("/{machine_id}/lend", response_model=MachineOut)
def lend_machine(farm_id: int, machine_id: int, data: LendRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    if machine.is_sold:
        raise HTTPException(status_code=400, detail="Verkaufte Fahrzeuge können nicht verliehen werden")
    target_farm = db.query(Farm).filter(Farm.id == data.lent_to_farm_id).first()
    if not target_farm:
        raise HTTPException(status_code=404, detail="Zielhof nicht gefunden")
    machine.lent_to_farm_id = data.lent_to_farm_id
    machine.status = MachineStatus.rented_out
    db.commit()
    db.refresh(machine)
    return _machine_out(machine, db)


@router.post("/{machine_id}/lend-lohnhof", response_model=MachineOut)
def lend_machine_to_lohnhof(farm_id: int, machine_id: int, data: LendLohnhofRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.models.lohnhof import LohnhofPartner
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    if machine.is_sold:
        raise HTTPException(status_code=400, detail="Verkaufte Fahrzeuge können nicht verliehen werden")
    lohnhof = db.query(LohnhofPartner).filter(LohnhofPartner.id == data.lohnhof_id, LohnhofPartner.farm_id == farm_id).first()
    if not lohnhof:
        raise HTTPException(status_code=404, detail="Lohnhof nicht gefunden")
    machine.lent_to_farm_id = None
    machine.lent_to_lohnhof_id = data.lohnhof_id
    machine.status = MachineStatus.rented_out
    db.commit()
    db.refresh(machine)
    return _machine_out(machine, db)


@router.post("/{machine_id}/unlend", response_model=MachineOut)
def unlend_machine(farm_id: int, machine_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    machine.lent_to_farm_id = None
    machine.lent_to_lohnhof_id = None
    machine.status = MachineStatus.available
    db.commit()
    db.refresh(machine)
    return _machine_out(machine, db)


@router.post("/{machine_id}/sell", response_model=MachineOut)
def sell_machine(farm_id: int, machine_id: int, data: SellRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    if machine.is_sold:
        raise HTTPException(status_code=400, detail="Fahrzeug bereits verkauft")
    machine.is_sold = True
    machine.sale_price = data.sale_price
    machine.sold_at = datetime.utcnow()
    machine.status = MachineStatus.sold
    machine.lent_to_farm_id = None
    machine.lent_to_lohnhof_id = None
    if data.sale_price > 0:
        db.add(FinanceEntry(
            farm_id=farm_id,
            type=TransactionType.income,
            category=FinanceCategory.machine_purchase,
            amount=data.sale_price,
            description=f"Fahrzeugverkauf: {machine.name}",
            date=datetime.utcnow(),
            machine_id=machine.id,
            created_by=user.id,
        ))
        capital = db.query(FarmCapital).filter(FarmCapital.farm_id == farm_id).first()
        if capital:
            capital.current_balance += data.sale_price
    db.commit()
    db.refresh(machine)
    return _machine_out(machine, db)


@router.post("/{machine_id}/rentals", response_model=MachineRentalOut)
def create_rental(farm_id: int, machine_id: int, data: MachineRentalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
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
    return {"message": "Fahrzeug zurückgegeben"}
