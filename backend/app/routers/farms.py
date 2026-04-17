from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.farm import Farm, FarmMember, MemberRole
from app.models.user import User
from app.models.todo import TodoBoard, TodoTask, TodoStatus, TodoPriority, TodoCategory
from app.schemas.farm import FarmCreate, FarmUpdate, FarmOut, FarmMemberOut, InviteMemberRequest
from app.core.security import get_current_user

router = APIRouter(prefix="/api/farms", tags=["farms"])

DEFAULT_TASKS = [
    ("Tagesbericht ausfüllen", "Allgemeinen Tagesbericht für den Betrieb ausfüllen", TodoCategory.general, TodoPriority.medium),
    ("Kraftstoff auffüllen", "Dieseltank und Betriebsmittel prüfen und ggf. auffüllen", TodoCategory.machine, TodoPriority.high),
    ("Maschinen Wochencheck", "Alle Maschinen auf Öl, Wasser und Reifendruck prüfen", TodoCategory.machine, TodoPriority.medium),
    ("Felder kartieren", "Felder auf aktuelle Bewirtschaftung und Status prüfen", TodoCategory.field_work, TodoPriority.medium),
    ("Bodenproben auswerten", "Bodenproben der Felder auswerten und Düngung planen", TodoCategory.field_work, TodoPriority.medium),
    ("Tiergesundheit kontrollieren", "Alle Tiere auf Gesundheit und Wohlbefinden prüfen", TodoCategory.animal, TodoPriority.high),
    ("Futtervorräte prüfen", "Futtervorräte kontrollieren und Nachbestellung planen", TodoCategory.storage, TodoPriority.high),
    ("Monatsabschluss Finanzen", "Einnahmen und Ausgaben des Monats buchen und abschließen", TodoCategory.finance, TodoPriority.medium),
    ("Biogasanlage warten", "Biogasanlage auf Funktion prüfen und Wartungsprotokoll führen", TodoCategory.biogas, TodoPriority.medium),
    ("Ernte planen", "Erntetermine und Maschinenplanung für die Haupternte vorbereiten", TodoCategory.harvest, TodoPriority.high),
    ("Fruchtfolge aktualisieren", "Fruchtfolgeplanung für das nächste Jahr aktualisieren", TodoCategory.planning, TodoPriority.low),
    ("Lagerhaltung kontrollieren", "Lagerbestände aller Betriebsstoffe und Ernteprodukte prüfen", TodoCategory.storage, TodoPriority.medium),
]


def get_farm_or_403(farm_id: int, user: User, db: Session) -> Farm:
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Hof nicht gefunden")
    is_member = db.query(FarmMember).filter(
        FarmMember.farm_id == farm_id,
        FarmMember.user_id == user.id,
        FarmMember.is_active == True
    ).first()
    if not is_member and farm.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Hof")
    return farm


@router.post("", response_model=FarmOut)
def create_farm(data: FarmCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    farm = Farm(**data.model_dump(), owner_id=user.id)
    db.add(farm)
    db.flush()
    member = FarmMember(farm_id=farm.id, user_id=user.id, role=MemberRole.owner)
    db.add(member)
    board = TodoBoard(farm_id=farm.id, name="Hauptboard", description="Standard Aufgabenboard")
    db.add(board)
    db.flush()
    for title, desc, cat, prio in DEFAULT_TASKS:
        task = TodoTask(
            board_id=board.id, title=title, description=desc,
            category=cat, priority=prio, status=TodoStatus.backlog,
            creator_id=user.id, is_template=True
        )
        db.add(task)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("", response_model=List[FarmOut])
def list_my_farms(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    memberships = db.query(FarmMember).filter(FarmMember.user_id == user.id, FarmMember.is_active == True).all()
    farm_ids = [m.farm_id for m in memberships]
    return db.query(Farm).filter(Farm.id.in_(farm_ids)).all()


@router.get("/{farm_id}", response_model=FarmOut)
def get_farm(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_farm_or_403(farm_id, user, db)


@router.put("/{farm_id}", response_model=FarmOut)
def update_farm(farm_id: int, data: FarmUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    farm = get_farm_or_403(farm_id, user, db)
    if farm.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Nur der Eigentümer kann den Hof bearbeiten")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(farm, field, value)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("/{farm_id}/members", response_model=List[FarmMemberOut])
def list_members(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_farm_or_403(farm_id, user, db)
    members = db.query(FarmMember).filter(FarmMember.farm_id == farm_id, FarmMember.is_active == True).all()
    result = []
    for m in members:
        u = db.query(User).filter(User.id == m.user_id).first()
        result.append(FarmMemberOut(
            id=m.id, farm_id=m.farm_id, user_id=m.user_id,
            role=m.role, joined_at=m.joined_at,
            username=u.username if u else None,
            full_name=u.full_name if u else None
        ))
    return result


@router.post("/{farm_id}/members/invite")
def invite_member(farm_id: int, req: InviteMemberRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    farm = get_farm_or_403(farm_id, user, db)
    if farm.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Nur der Eigentümer kann Mitglieder einladen")
    invitee = db.query(User).filter(User.username == req.username).first()
    if not invitee:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    existing = db.query(FarmMember).filter(FarmMember.farm_id == farm_id, FarmMember.user_id == invitee.id).first()
    if existing:
        if existing.is_active:
            raise HTTPException(status_code=400, detail="Benutzer ist bereits Mitglied")
        existing.is_active = True
        existing.role = req.role
        db.commit()
        return {"message": "Mitglied reaktiviert"}
    member = FarmMember(farm_id=farm_id, user_id=invitee.id, role=req.role, invited_by=user.id)
    db.add(member)
    db.commit()
    return {"message": f"{invitee.username} wurde eingeladen"}


@router.delete("/{farm_id}/members/{user_id}")
def remove_member(farm_id: int, user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    farm = get_farm_or_403(farm_id, user, db)
    if farm.owner_id != user.id and user.id != user_id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    member = db.query(FarmMember).filter(FarmMember.farm_id == farm_id, FarmMember.user_id == user_id).first()
    if member:
        member.is_active = False
        db.commit()
    return {"message": "Mitglied entfernt"}
