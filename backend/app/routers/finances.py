from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models.finance import FinanceEntry, TransactionType
from app.models.farm import FarmMember
from app.schemas.finance import FinanceCreate, FinanceUpdate, FinanceOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/farms/{farm_id}/finances", tags=["finances"])


def check_access(farm_id: int, user: User, db: Session):
    m = db.query(FarmMember).filter(FarmMember.farm_id == farm_id, FarmMember.user_id == user.id, FarmMember.is_active == True).first()
    if not m:
        raise HTTPException(status_code=403, detail="Kein Zugriff")


@router.get("", response_model=List[FinanceOut])
def list_finances(farm_id: int, year: Optional[int] = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    q = db.query(FinanceEntry).filter(FinanceEntry.farm_id == farm_id)
    if year:
        q = q.filter(func.strftime('%Y', FinanceEntry.date) == str(year))
    return q.order_by(FinanceEntry.date.desc()).all()


@router.post("", response_model=FinanceOut)
def create_finance(farm_id: int, data: FinanceCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    entry = FinanceEntry(**data.model_dump(), farm_id=farm_id, created_by=user.id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=FinanceOut)
def update_finance(farm_id: int, entry_id: int, data: FinanceUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    entry = db.query(FinanceEntry).filter(FinanceEntry.id == entry_id, FinanceEntry.farm_id == farm_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(entry, k, v)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}")
def delete_finance(farm_id: int, entry_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    entry = db.query(FinanceEntry).filter(FinanceEntry.id == entry_id, FinanceEntry.farm_id == farm_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    db.delete(entry)
    db.commit()
    return {"message": "Eintrag gelöscht"}


@router.get("/summary")
def get_summary(farm_id: int, year: Optional[int] = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    q = db.query(FinanceEntry).filter(FinanceEntry.farm_id == farm_id)
    if year:
        q = q.filter(func.strftime('%Y', FinanceEntry.date) == str(year))
    entries = q.all()
    total_income = sum(e.amount for e in entries if e.type == TransactionType.income)
    total_expense = sum(e.amount for e in entries if e.type == TransactionType.expense)
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "count": len(entries)
    }
