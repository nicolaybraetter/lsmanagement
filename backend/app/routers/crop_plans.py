import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.field import CropRotationPlan
from app.models.farm import FarmMember
from app.schemas.field import CropRotationPlanCreate, CropRotationPlanOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/farms/{farm_id}/crop-plans", tags=["crop-plans"])


def check_access(farm_id: int, user: User, db: Session):
    m = db.query(FarmMember).filter(
        FarmMember.farm_id == farm_id,
        FarmMember.user_id == user.id,
        FarmMember.is_active == True,
    ).first()
    if not m:
        raise HTTPException(status_code=403, detail="Kein Zugriff")


def plan_to_dict(p: CropRotationPlan) -> dict:
    return {
        "id": p.id,
        "farm_id": p.farm_id,
        "name": p.name,
        "description": p.description,
        "crops": p.crops,
        "game_version": p.game_version,
        "created_at": str(p.created_at),
    }


@router.get("")
def list_plans(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    plans = db.query(CropRotationPlan).filter(
        CropRotationPlan.farm_id == farm_id
    ).order_by(CropRotationPlan.created_at.desc()).all()
    return [plan_to_dict(p) for p in plans]


@router.post("")
def create_plan(farm_id: int, data: CropRotationPlanCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    if not data.crops:
        raise HTTPException(status_code=422, detail="Fruchtfolge darf nicht leer sein")
    plan = CropRotationPlan(
        farm_id=farm_id,
        name=data.name,
        description=data.description,
        crops_json=json.dumps(data.crops),
        game_version=data.game_version,
        created_by=user.id,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan_to_dict(plan)


@router.delete("/{plan_id}")
def delete_plan(farm_id: int, plan_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    plan = db.query(CropRotationPlan).filter(
        CropRotationPlan.id == plan_id,
        CropRotationPlan.farm_id == farm_id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan nicht gefunden")
    db.delete(plan)
    db.commit()
    return {"ok": True}
