from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models.finance import FinanceEntry, TransactionType
from app.models.farm import FarmMember
from app.models.invoice import FarmCapital
from app.schemas.finance import FinanceCreate, FinanceUpdate, FinanceOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/farms/{farm_id}/finances", tags=["finances"])


def check_access(farm_id: int, user: User, db: Session):
    m = db.query(FarmMember).filter(FarmMember.farm_id == farm_id, FarmMember.user_id == user.id, FarmMember.is_active == True).first()
    if not m:
        raise HTTPException(status_code=403, detail="Kein Zugriff")


def _capital_delta(type: TransactionType, amount: float) -> float:
    return amount if type == TransactionType.income else -amount


def _adjust_capital(farm_id: int, delta: float, db: Session):
    capital = db.query(FarmCapital).filter(FarmCapital.farm_id == farm_id).first()
    if capital:
        capital.current_balance += delta


def _recompute_capital(farm_id: int, db: Session):
    capital = db.query(FarmCapital).filter(FarmCapital.farm_id == farm_id).first()
    if not capital:
        return
    totals = db.query(
        func.coalesce(func.sum(FinanceEntry.amount).filter(FinanceEntry.type == TransactionType.income), 0.0),
        func.coalesce(func.sum(FinanceEntry.amount).filter(FinanceEntry.type == TransactionType.expense), 0.0),
    ).filter(FinanceEntry.farm_id == farm_id).first()
    income_total = float(totals[0] or 0)
    expense_total = float(totals[1] or 0)
    capital.current_balance = round(float(capital.starting_capital or 0) + income_total - expense_total, 2)


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
    _adjust_capital(farm_id, _capital_delta(data.type, data.amount), db)
    _recompute_capital(farm_id, db)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=FinanceOut)
def update_finance(farm_id: int, entry_id: int, data: FinanceUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    entry = db.query(FinanceEntry).filter(FinanceEntry.id == entry_id, FinanceEntry.farm_id == farm_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    # Reverse old effect
    _adjust_capital(farm_id, -_capital_delta(entry.type, entry.amount), db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(entry, k, v)
    # Apply new effect
    _adjust_capital(farm_id, _capital_delta(entry.type, entry.amount), db)
    _recompute_capital(farm_id, db)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}")
def delete_finance(farm_id: int, entry_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    entry = db.query(FinanceEntry).filter(FinanceEntry.id == entry_id, FinanceEntry.farm_id == farm_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    # Reverse effect on capital
    _adjust_capital(farm_id, -_capital_delta(entry.type, entry.amount), db)
    db.delete(entry)
    _recompute_capital(farm_id, db)
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
