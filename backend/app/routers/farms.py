from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.farm import Farm, FarmMember, MemberRole
from app.models.invitation import FarmInvitation, InvitationStatus
from app.models.user import User
from app.models.todo import TodoBoard, TodoTask, TodoStatus, TodoPriority, TodoCategory
from app.schemas.farm import FarmCreate, FarmUpdate, FarmOut, FarmMemberOut, InviteMemberRequest
from app.core.security import get_current_user
from app.core.email import send_farm_invitation

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
    member_record = db.query(FarmMember).filter(FarmMember.farm_id == farm_id, FarmMember.user_id == user.id, FarmMember.is_active == True).first()
    if farm.owner_id != user.id and (not member_record or member_record.role not in [MemberRole.owner, MemberRole.manager]):
        raise HTTPException(status_code=403, detail="Nur Eigentümer und Manager können einladen")
    invitee = db.query(User).filter(User.username == req.username).first()
    if not invitee:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    if invitee.id == user.id:
        raise HTTPException(status_code=400, detail="Du kannst dich nicht selbst einladen")
    existing_member = db.query(FarmMember).filter(FarmMember.farm_id == farm_id, FarmMember.user_id == invitee.id, FarmMember.is_active == True).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="Benutzer ist bereits Mitglied dieses Hofes")
    pending = db.query(FarmInvitation).filter(
        FarmInvitation.farm_id == farm_id,
        FarmInvitation.invitee_id == invitee.id,
        FarmInvitation.status == InvitationStatus.pending
    ).first()
    if pending:
        raise HTTPException(status_code=400, detail="Es gibt bereits eine ausstehende Einladung für diesen Benutzer")
    inv = FarmInvitation(
        farm_id=farm_id,
        invitee_id=invitee.id,
        inviter_id=user.id,
        role=req.role,
        message=getattr(req, 'message', None),
    )
    db.add(inv)
    db.commit()
    send_farm_invitation(
        invitee_email=invitee.email,
        invitee_name=invitee.full_name or invitee.username,
        inviter_name=user.full_name or user.username,
        farm_name=farm.name,
        role=req.role,
        personal_msg=getattr(req, 'message', '') or '',
    )
    return {"message": f"Einladung an {invitee.username} gesendet"}


@router.get("/invitations/pending")
def get_pending_invitations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    invitations = db.query(FarmInvitation).filter(
        FarmInvitation.invitee_id == user.id,
        FarmInvitation.status == InvitationStatus.pending
    ).all()
    result = []
    for inv in invitations:
        farm = db.query(Farm).filter(Farm.id == inv.farm_id).first()
        inviter = db.query(User).filter(User.id == inv.inviter_id).first()
        result.append({
            "id": inv.id,
            "farm_id": inv.farm_id,
            "farm_name": farm.name if farm else "Unbekannt",
            "farm_game_version": farm.game_version if farm else "",
            "inviter_name": inviter.full_name or inviter.username if inviter else "Unbekannt",
            "role": inv.role,
            "message": inv.message,
            "created_at": inv.created_at,
        })
    return result


@router.post("/invitations/{inv_id}/accept")
def accept_invitation(inv_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.query(FarmInvitation).filter(FarmInvitation.id == inv_id, FarmInvitation.invitee_id == user.id).first()
    if not inv or inv.status != InvitationStatus.pending:
        raise HTTPException(status_code=404, detail="Einladung nicht gefunden oder bereits beantwortet")
    inv.status = InvitationStatus.accepted
    inv.responded_at = datetime.utcnow()
    existing = db.query(FarmMember).filter(FarmMember.farm_id == inv.farm_id, FarmMember.user_id == user.id).first()
    if existing:
        existing.is_active = True
        existing.role = inv.role
    else:
        db.add(FarmMember(farm_id=inv.farm_id, user_id=user.id, role=inv.role, invited_by=inv.inviter_id))
    db.commit()
    farm = db.query(Farm).filter(Farm.id == inv.farm_id).first()
    farm_name = farm.name if farm else ""
    return {"message": f"Du bist jetzt Mitglied von '{farm_name}'"}


@router.post("/invitations/{inv_id}/reject")
def reject_invitation(inv_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.query(FarmInvitation).filter(FarmInvitation.id == inv_id, FarmInvitation.invitee_id == user.id).first()
    if not inv or inv.status != InvitationStatus.pending:
        raise HTTPException(status_code=404, detail="Einladung nicht gefunden oder bereits beantwortet")
    inv.status = InvitationStatus.rejected
    inv.responded_at = datetime.utcnow()
    db.commit()
    return {"message": "Einladung abgelehnt"}


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


@router.delete("/{farm_id}")
def delete_farm(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.models.machine import Machine, MachineRental
    from app.models.field import Field, CropRotationPlan
    from app.models.finance import FinanceEntry
    from app.models.storage import StorageItem, StorageTransaction
    from app.models.animal import Stable, Animal
    from app.models.biogas import BiogasPlant, BiogasFeedEntry
    from app.models.invoice import Invoice, InvoiceItem, FarmCapital
    from app.models.notification import Notification

    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Hof nicht gefunden")
    if farm.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Nur der Eigentümer kann den Hof löschen")

    # Machines & rentals
    machine_ids = [m.id for m in db.query(Machine).filter(Machine.farm_id == farm_id).all()]
    if machine_ids:
        db.query(MachineRental).filter(MachineRental.machine_id.in_(machine_ids)).delete(synchronize_session=False)
    db.query(Machine).filter(Machine.farm_id == farm_id).delete(synchronize_session=False)
    db.query(Machine).filter(Machine.lent_to_farm_id == farm_id).update(
        {"lent_to_farm_id": None}, synchronize_session=False
    )

    # Fields & crop rotation
    field_ids = [f.id for f in db.query(Field).filter(Field.farm_id == farm_id).all()]
    if field_ids:
        db.query(CropRotationPlan).filter(CropRotationPlan.field_id.in_(field_ids)).delete(synchronize_session=False)
    db.query(Field).filter(Field.farm_id == farm_id).delete(synchronize_session=False)

    # Finances
    db.query(FinanceEntry).filter(FinanceEntry.farm_id == farm_id).delete(synchronize_session=False)

    # Storage & transactions
    storage_ids = [s.id for s in db.query(StorageItem).filter(StorageItem.farm_id == farm_id).all()]
    if storage_ids:
        db.query(StorageTransaction).filter(StorageTransaction.storage_item_id.in_(storage_ids)).delete(synchronize_session=False)
    db.query(StorageItem).filter(StorageItem.farm_id == farm_id).delete(synchronize_session=False)

    # Animals & stables
    stable_ids = [s.id for s in db.query(Stable).filter(Stable.farm_id == farm_id).all()]
    if stable_ids:
        db.query(Animal).filter(Animal.stable_id.in_(stable_ids)).delete(synchronize_session=False)
    db.query(Stable).filter(Stable.farm_id == farm_id).delete(synchronize_session=False)

    # Biogas
    plant = db.query(BiogasPlant).filter(BiogasPlant.farm_id == farm_id).first()
    if plant:
        db.query(BiogasFeedEntry).filter(BiogasFeedEntry.plant_id == plant.id).delete(synchronize_session=False)
        db.delete(plant)

    # Todo boards & tasks
    board_ids = [b.id for b in db.query(TodoBoard).filter(TodoBoard.farm_id == farm_id).all()]
    if board_ids:
        db.query(TodoTask).filter(TodoTask.board_id.in_(board_ids)).delete(synchronize_session=False)
    db.query(TodoBoard).filter(TodoBoard.farm_id == farm_id).delete(synchronize_session=False)

    # Invoices & items
    invoice_ids = [i.id for i in db.query(Invoice).filter(
        (Invoice.sender_farm_id == farm_id) | (Invoice.receiver_farm_id == farm_id)
    ).all()]
    if invoice_ids:
        db.query(InvoiceItem).filter(InvoiceItem.invoice_id.in_(invoice_ids)).delete(synchronize_session=False)
    db.query(Invoice).filter(
        (Invoice.sender_farm_id == farm_id) | (Invoice.receiver_farm_id == farm_id)
    ).delete(synchronize_session=False)
    db.query(FarmCapital).filter(FarmCapital.farm_id == farm_id).delete(synchronize_session=False)

    # Invitations & members
    db.query(FarmInvitation).filter(FarmInvitation.farm_id == farm_id).delete(synchronize_session=False)
    db.query(FarmMember).filter(FarmMember.farm_id == farm_id).delete(synchronize_session=False)

    # Notifications
    db.query(Notification).filter(Notification.farm_id == farm_id).delete(synchronize_session=False)

    db.delete(farm)
    db.commit()
    return {"ok": True}
