from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.lohnhof import LohnhofPartner
from app.models.farm import FarmMember, MemberRole
from app.core.security import get_current_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/api/farms/{farm_id}/lohnhoefe", tags=["lohnhoefe"])


class LohnhofCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class LohnhofUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


def _check_member(farm_id: int, user: User, db: Session):
    m = db.query(FarmMember).filter(
        FarmMember.farm_id == farm_id,
        FarmMember.user_id == user.id,
        FarmMember.is_active == True,
    ).first()
    if not m:
        raise HTTPException(status_code=403, detail="Kein Zugriff")


def _check_manager(farm_id: int, user: User, db: Session):
    m = db.query(FarmMember).filter(
        FarmMember.farm_id == farm_id,
        FarmMember.user_id == user.id,
        FarmMember.is_active == True,
        FarmMember.role.in_([MemberRole.owner, MemberRole.manager]),
    ).first()
    if not m:
        raise HTTPException(status_code=403, detail="Nur Eigentümer und Manager")


def _serialize(p: LohnhofPartner) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "contact_person": p.contact_person,
        "phone": p.phone,
        "notes": p.notes,
    }


@router.get("")
def list_lohnhoefe(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _check_member(farm_id, user, db)
    partners = db.query(LohnhofPartner).filter(LohnhofPartner.farm_id == farm_id).order_by(LohnhofPartner.id).all()
    return [_serialize(p) for p in partners]


@router.post("")
def create_lohnhof(farm_id: int, data: LohnhofCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _check_manager(farm_id, user, db)
    count = db.query(LohnhofPartner).filter(LohnhofPartner.farm_id == farm_id).count()
    if count >= 10:
        raise HTTPException(status_code=400, detail="Maximal 10 Lohnhöfe erlaubt")
    if not data.name.strip():
        raise HTTPException(status_code=422, detail="Name ist erforderlich")
    p = LohnhofPartner(farm_id=farm_id, **data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return _serialize(p)


@router.put("/{partner_id}")
def update_lohnhof(farm_id: int, partner_id: int, data: LohnhofUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _check_manager(farm_id, user, db)
    p = db.query(LohnhofPartner).filter(LohnhofPartner.id == partner_id, LohnhofPartner.farm_id == farm_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Lohnhof nicht gefunden")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return _serialize(p)


@router.delete("/{partner_id}")
def delete_lohnhof(farm_id: int, partner_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _check_manager(farm_id, user, db)
    p = db.query(LohnhofPartner).filter(LohnhofPartner.id == partner_id, LohnhofPartner.farm_id == farm_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Lohnhof nicht gefunden")
    db.delete(p)
    db.commit()
    return {"ok": True}
