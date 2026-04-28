from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.machine import Machine, MachineRental, MachineStatus, MachineServiceEntry
from app.models.farm import Farm, FarmMember
from app.models.finance import FinanceEntry, TransactionType, FinanceCategory
from app.models.invoice import FarmCapital
from app.schemas.machine import (
    MachineCreate, MachineUpdate, MachineOut, MachineRentalCreate,
    MachineRentalOut, LendRequest, SellRequest, MachineServiceCreate, MachineServiceOut,
)
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


def _machine_out(machine: Machine, db: Session, is_borrowed: bool = False, owned_by_farm_name: str | None = None) -> dict:
    data = {c.name: getattr(machine, c.name) for c in machine.__table__.columns}
    lent_farm = db.query(Farm).filter(Farm.id == machine.lent_to_farm_id).first() if machine.lent_to_farm_id else None
    data["lent_to_farm_name"] = lent_farm.name if lent_farm else None
    data["is_borrowed"] = is_borrowed
    data["owned_by_farm_name"] = owned_by_farm_name
    return data


@router.get("", response_model=List[MachineOut])
def list_machines(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    own_machines = db.query(Machine).filter(Machine.farm_id == farm_id).all()
    borrowed_machines = db.query(Machine).filter(
        Machine.lent_to_farm_id == farm_id,
        Machine.is_sold == False,
    ).all()
    result = [_machine_out(m, db) for m in own_machines]
    for m in borrowed_machines:
        owner_farm = db.query(Farm).filter(Farm.id == m.farm_id).first()
        result.append(_machine_out(m, db, is_borrowed=True, owned_by_farm_name=owner_farm.name if owner_farm else None))
    return result


@router.get("/lend-targets")
def list_lend_targets(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    farms = db.query(Farm).filter(Farm.is_active == True, Farm.id != farm_id).order_by(Farm.name.asc()).all()
    return [{"id": f.id, "name": f.name, "game_version": f.game_version} for f in farms]


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


@router.post("/{machine_id}/unlend", response_model=MachineOut)
def unlend_machine(farm_id: int, machine_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    machine.lent_to_farm_id = None
    machine.status = MachineStatus.available
    db.commit()
    db.refresh(machine)
    return _machine_out(machine, db)


@router.post("/{machine_id}/return-borrowed", response_model=MachineOut)
def return_borrowed_machine(farm_id: int, machine_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.lent_to_farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Geliehenes Fahrzeug nicht gefunden")
    machine.lent_to_farm_id = None
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


@router.get("/{machine_id}/services", response_model=List[MachineServiceOut])
def list_services(farm_id: int, machine_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    return (
        db.query(MachineServiceEntry)
        .filter(MachineServiceEntry.machine_id == machine_id, MachineServiceEntry.farm_id == farm_id)
        .order_by(MachineServiceEntry.service_date.desc(), MachineServiceEntry.created_at.desc())
        .all()
    )


@router.post("/{machine_id}/services", response_model=MachineServiceOut)
def create_service(
    farm_id: int,
    machine_id: int,
    data: MachineServiceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    check_access(farm_id, user, db)
    machine = db.query(Machine).filter(Machine.id == machine_id, Machine.farm_id == farm_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")

    entry = MachineServiceEntry(
        machine_id=machine_id,
        farm_id=farm_id,
        type=data.type,
        title=data.title,
        description=data.description,
        cost=data.cost or 0,
        service_date=data.service_date,
        created_by=user.id,
    )
    db.add(entry)

    if entry.cost and entry.cost > 0:
        db.add(FinanceEntry(
            farm_id=farm_id,
            type=TransactionType.expense,
            category=FinanceCategory.repair,
            amount=entry.cost,
            description=f"{entry.type}: {machine.name} – {entry.title}",
            date=entry.service_date,
            machine_id=machine.id,
            created_by=user.id,
        ))
        capital = db.query(FarmCapital).filter(FarmCapital.farm_id == farm_id).first()
        if capital:
            capital.current_balance -= entry.cost

    if entry.type.value == "Wartung":
        machine.status = MachineStatus.maintenance
    elif entry.type.value == "Reparatur":
        machine.status = MachineStatus.broken

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{machine_id}/services/{entry_id}")
def delete_service(
    farm_id: int,
    machine_id: int,
    entry_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    check_access(farm_id, user, db)
    entry = db.query(MachineServiceEntry).filter(
        MachineServiceEntry.id == entry_id,
        MachineServiceEntry.machine_id == machine_id,
        MachineServiceEntry.farm_id == farm_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Serviceeintrag nicht gefunden")
    db.delete(entry)
    db.commit()
    return {"ok": True}
