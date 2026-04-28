from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import re
from app.database import get_db
from app.models.invoice import Invoice, InvoiceItem, FarmCapital, InvoiceStatus
from app.models.farm import Farm, FarmMember, MemberRole
from app.models.finance import FinanceEntry, TransactionType, FinanceCategory
from app.models.user import User
from app.schemas.invoice import InvoiceCreate, InvoiceOut, FarmCapitalSet, FarmCapitalOut
from app.core.security import get_current_user

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


def _is_farm_member(farm_id: int, user: User, db: Session) -> Optional[FarmMember]:
    return db.query(FarmMember).filter(
        FarmMember.farm_id == farm_id,
        FarmMember.user_id == user.id,
        FarmMember.is_active == True
    ).first()


def _is_manager_or_owner(farm_id: int, user: User, db: Session) -> bool:
    m = _is_farm_member(farm_id, user, db)
    if not m:
        return False
    return m.role in (MemberRole.owner, MemberRole.manager)


def _generate_invoice_number(db: Session, farm_id: int) -> str:
    year = datetime.now().year
    count = db.query(Invoice).filter(
        Invoice.sender_farm_id == farm_id
    ).count() + 1
    return f"RE-{farm_id}-{year}-{count:04d}"


def _calc_totals(items_data: list, tax_rate: float):
    net = sum(i["quantity"] * i["unit_price"] for i in items_data)
    gross = net * (1 + tax_rate / 100)
    return round(net, 2), round(gross, 2)


def _recompute_capital_for_farm(farm_id: int, db: Session):
    cap = db.query(FarmCapital).filter(FarmCapital.farm_id == farm_id).first()
    if not cap:
        return
    totals = db.query(
        func.coalesce(func.sum(FinanceEntry.amount).filter(FinanceEntry.type == TransactionType.income), 0.0),
        func.coalesce(func.sum(FinanceEntry.amount).filter(FinanceEntry.type == TransactionType.expense), 0.0),
    ).filter(FinanceEntry.farm_id == farm_id).first()
    income_total = float(totals[0] or 0)
    expense_total = float(totals[1] or 0)
    cap.current_balance = round(float(cap.starting_capital or 0) + income_total - expense_total, 2)


def _enrich(inv: Invoice, db: Session) -> InvoiceOut:
    sender = db.query(Farm).filter(Farm.id == inv.sender_farm_id).first()
    receiver = db.query(Farm).filter(Farm.id == inv.receiver_farm_id).first()
    out = InvoiceOut(
        id=inv.id, invoice_number=inv.invoice_number,
        sender_farm_id=inv.sender_farm_id, receiver_farm_id=inv.receiver_farm_id,
        status=inv.status, issue_date=inv.issue_date, due_date=inv.due_date,
        paid_date=inv.paid_date, total_net=inv.total_net, tax_rate=inv.tax_rate,
        total_gross=inv.total_gross, notes=inv.notes, created_by=inv.created_by,
        created_at=inv.created_at,
        items=[InvoiceOut.model_fields  # will be overridden below
               ] if False else [],
        sender_farm_name=sender.name if sender else None,
        receiver_farm_name=receiver.name if receiver else None,
    )
    from app.schemas.invoice import InvoiceItemOut
    out.items = [InvoiceItemOut(
        id=item.id, invoice_id=item.invoice_id, item_type=item.item_type,
        description=item.description, quantity=item.quantity, unit=item.unit,
        unit_price=item.unit_price, total=item.total, field_number=item.field_number
    ) for item in inv.items]
    return out


# ── Capital endpoints ──────────────────────────────────────────────

@router.get("/capital/{farm_id}", response_model=FarmCapitalOut)
def get_capital(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not _is_farm_member(farm_id, user, db):
        raise HTTPException(status_code=403, detail="Kein Zugriff")
    cap = db.query(FarmCapital).filter(FarmCapital.farm_id == farm_id).first()
    if not cap:
        raise HTTPException(status_code=404, detail="Kein Startkapital definiert")
    _recompute_capital_for_farm(farm_id, db)
    db.commit()
    db.refresh(cap)
    return cap


@router.put("/capital/{farm_id}", response_model=FarmCapitalOut)
def set_capital(farm_id: int, data: FarmCapitalSet, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not _is_manager_or_owner(farm_id, user, db):
        raise HTTPException(status_code=403, detail="Nur Manager/Eigentümer können das Startkapital setzen")
    cap = db.query(FarmCapital).filter(FarmCapital.farm_id == farm_id).first()
    if cap:
        cap.starting_capital = data.starting_capital
        if data.current_balance is not None:
            cap.current_balance = data.current_balance
        cap.set_by = user.id
    else:
        cap = FarmCapital(
            farm_id=farm_id,
            starting_capital=data.starting_capital,
            current_balance=data.current_balance if data.current_balance is not None else data.starting_capital,
            set_by=user.id
        )
        db.add(cap)
    _recompute_capital_for_farm(farm_id, db)
    db.commit()
    db.refresh(cap)
    return cap


@router.get("/pending-count/{farm_id}")
def pending_invoice_count(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not _is_farm_member(farm_id, user, db):
        raise HTTPException(status_code=403, detail="Kein Zugriff")
    count = db.query(Invoice).filter(
        Invoice.receiver_farm_id == farm_id,
        Invoice.status.in_([InvoiceStatus.sent, InvoiceStatus.viewed, InvoiceStatus.overdue])
    ).count()
    return {"count": count}


@router.get("/farms/all", response_model=List[dict])
def list_all_farms(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """List all farms (for invoice recipient selection)."""
    farms = db.query(Farm).filter(Farm.is_active == True).order_by(Farm.name.asc()).all()
    return [{"id": f.id, "name": f.name, "game_version": f.game_version, "owner_id": f.owner_id} for f in farms]


# ── Invoice endpoints ─────────────────────────────────────────────

@router.post("", response_model=InvoiceOut)
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Find a farm where user is owner/manager to act as sender
    memberships = db.query(FarmMember).filter(
        FarmMember.user_id == user.id, FarmMember.is_active == True,
        FarmMember.role.in_([MemberRole.owner, MemberRole.manager])
    ).all()
    if not memberships:
        raise HTTPException(status_code=403, detail="Kein Hof als Manager/Eigentümer gefunden")

    sender_farm_id = memberships[0].farm_id

    receiver_farm = db.query(Farm).filter(Farm.id == data.receiver_farm_id).first()
    if not receiver_farm:
        raise HTTPException(status_code=404, detail="Empfänger-Hof nicht gefunden")
    if receiver_farm.id == sender_farm_id:
        raise HTTPException(status_code=400, detail="Rechnungsempfänger darf nicht der eigene Hof sein")

    items_data = [i.model_dump() for i in data.items]
    net, gross = _calc_totals(items_data, data.tax_rate)

    invoice = Invoice(
        invoice_number=_generate_invoice_number(db, sender_farm_id),
        sender_farm_id=sender_farm_id,
        receiver_farm_id=data.receiver_farm_id,
        status=InvoiceStatus.draft,
        issue_date=data.issue_date,
        due_date=data.due_date,
        tax_rate=data.tax_rate,
        total_net=net,
        total_gross=gross,
        notes=data.notes,
        created_by=user.id,
    )
    db.add(invoice)
    db.flush()

    for item in data.items:
        db.add(InvoiceItem(
            invoice_id=invoice.id,
            item_type=item.item_type,
            description=item.description,
            quantity=item.quantity,
            unit=item.unit,
            unit_price=item.unit_price,
            total=round(item.quantity * item.unit_price, 2),
            field_number=item.field_number,
        ))
    db.commit()
    db.refresh(invoice)
    return _enrich(invoice, db)


@router.post("/from-farm/{farm_id}", response_model=InvoiceOut)
def create_invoice_from_farm(
    farm_id: int, data: InvoiceCreate,
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    if not _is_manager_or_owner(farm_id, user, db):
        raise HTTPException(status_code=403, detail="Kein Zugriff")
    receiver_farm = db.query(Farm).filter(Farm.id == data.receiver_farm_id).first()
    if not receiver_farm:
        raise HTTPException(status_code=404, detail="Empfänger-Hof nicht gefunden")
    if receiver_farm.id == farm_id:
        raise HTTPException(status_code=400, detail="Rechnungsempfänger darf nicht der eigene Hof sein")

    items_data = [i.model_dump() for i in data.items]
    net, gross = _calc_totals(items_data, data.tax_rate)

    invoice = Invoice(
        invoice_number=_generate_invoice_number(db, farm_id),
        sender_farm_id=farm_id,
        receiver_farm_id=data.receiver_farm_id,
        status=InvoiceStatus.draft,
        issue_date=data.issue_date,
        due_date=data.due_date,
        tax_rate=data.tax_rate,
        total_net=net,
        total_gross=gross,
        notes=data.notes,
        created_by=user.id,
    )
    db.add(invoice)
    db.flush()
    for item in data.items:
        db.add(InvoiceItem(
            invoice_id=invoice.id,
            item_type=item.item_type,
            description=item.description,
            quantity=item.quantity,
            unit=item.unit,
            unit_price=item.unit_price,
            total=round(item.quantity * item.unit_price, 2),
            field_number=item.field_number,
        ))
    db.commit()
    db.refresh(invoice)
    return _enrich(invoice, db)


@router.get("/sent/{farm_id}", response_model=List[InvoiceOut])
def list_sent(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not _is_farm_member(farm_id, user, db):
        raise HTTPException(status_code=403, detail="Kein Zugriff")
    invs = db.query(Invoice).filter(Invoice.sender_farm_id == farm_id).order_by(Invoice.created_at.desc()).all()
    return [_enrich(i, db) for i in invs]


@router.get("/received/{farm_id}", response_model=List[InvoiceOut])
def list_received(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not _is_farm_member(farm_id, user, db):
        raise HTTPException(status_code=403, detail="Kein Zugriff")
    invs = db.query(Invoice).filter(Invoice.receiver_farm_id == farm_id).order_by(Invoice.created_at.desc()).all()
    # Mark as viewed
    for inv in invs:
        if inv.status == InvoiceStatus.sent:
            inv.status = InvoiceStatus.viewed
    db.commit()
    return [_enrich(i, db) for i in invs]


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Rechnung nicht gefunden")
    # Must be member of sender or receiver farm
    sender_ok = _is_farm_member(inv.sender_farm_id, user, db)
    receiver_ok = _is_farm_member(inv.receiver_farm_id, user, db)
    if not sender_ok and not receiver_ok:
        raise HTTPException(status_code=403, detail="Kein Zugriff")
    return _enrich(inv, db)


@router.post("/{invoice_id}/send")
def send_invoice(invoice_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Rechnung nicht gefunden")
    if not _is_manager_or_owner(inv.sender_farm_id, user, db):
        raise HTTPException(status_code=403, detail="Kein Zugriff")
    if inv.status != InvoiceStatus.draft:
        raise HTTPException(status_code=400, detail="Nur Entwürfe können gestellt werden")
    inv.status = InvoiceStatus.sent
    db.commit()
    return {"message": "Rechnung gestellt", "invoice_number": inv.invoice_number}


@router.post("/{invoice_id}/pay")
def pay_invoice(invoice_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Rechnung nicht gefunden")
    if not _is_farm_member(inv.receiver_farm_id, user, db):
        raise HTTPException(status_code=403, detail="Nur Mitglieder des Empfänger-Hofs können bezahlen")
    if inv.status not in (InvoiceStatus.sent, InvoiceStatus.viewed, InvoiceStatus.overdue):
        raise HTTPException(status_code=400, detail=f"Rechnung kann in Status '{inv.status}' nicht bezahlt werden")

    inv.status = InvoiceStatus.paid
    inv.paid_date = datetime.utcnow()
    db.commit()

    # Automatically book finance entries on both farms
    # Sender gets income
    db.add(FinanceEntry(
        farm_id=inv.sender_farm_id,
        type=TransactionType.income,
        category=FinanceCategory.contract_work,
        amount=inv.total_gross,
        description=f"Zahlung für Rechnung {inv.invoice_number}",
        date=datetime.utcnow(),
        reference_number=inv.invoice_number,
        created_by=user.id,
    ))
    # Receiver gets expense
    db.add(FinanceEntry(
        farm_id=inv.receiver_farm_id,
        type=TransactionType.expense,
        category=FinanceCategory.contract_work,
        amount=inv.total_gross,
        description=f"Zahlung Rechnung {inv.invoice_number} an {db.query(Farm).filter(Farm.id==inv.sender_farm_id).first().name}",
        date=datetime.utcnow(),
        reference_number=inv.invoice_number,
        created_by=user.id,
    ))

    _recompute_capital_for_farm(inv.sender_farm_id, db)
    _recompute_capital_for_farm(inv.receiver_farm_id, db)

    db.commit()
    return {"message": "Rechnung bezahlt", "amount": inv.total_gross}


@router.post("/{invoice_id}/cancel")
def cancel_invoice(invoice_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Rechnung nicht gefunden")
    if not _is_manager_or_owner(inv.sender_farm_id, user, db):
        raise HTTPException(status_code=403, detail="Kein Zugriff")
    if inv.status == InvoiceStatus.paid:
        raise HTTPException(status_code=400, detail="Bezahlte Rechnungen können nicht storniert werden")
    inv.status = InvoiceStatus.cancelled
    db.commit()
    return {"message": "Rechnung storniert"}

