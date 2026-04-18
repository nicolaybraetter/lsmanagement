from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import timedelta
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.system_config import SystemConfig
from app.core.config import settings
from app.core.security import create_access_token, verify_admin_token, get_password_hash

router = APIRouter(prefix="/api/admin", tags=["admin"])


class AdminLoginRequest(BaseModel):
    password: str


class PasswordResetRequest(BaseModel):
    new_password: str


class CredentialsUpdateRequest(BaseModel):
    new_username: str
    new_email: Optional[str] = None


class EmailConfigUpdate(BaseModel):
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str
    smtp_from: str
    operator_email: str


@router.post("/auth")
def admin_login(data: AdminLoginRequest):
    if data.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Falsches Admin-Passwort")
    token = create_access_token(
        {"sub": "admin", "is_admin": True},
        expires_delta=timedelta(hours=8),
    )
    return {"access_token": token, "token_type": "bearer"}


@router.get("/users")
def list_users(db: Session = Depends(get_db), _=Depends(verify_admin_token)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "is_active": u.is_active,
            "created_at": str(u.created_at) if u.created_at else None,
        }
        for u in users
    ]


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(verify_admin_token)):
    from app.models.farm import FarmMember
    from app.models.invitation import FarmInvitation
    from app.models.todo import TodoTask

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    db.query(FarmMember).filter(FarmMember.user_id == user_id).delete()
    db.query(FarmInvitation).filter(
        (FarmInvitation.invitee_id == user_id) | (FarmInvitation.inviter_id == user_id)
    ).delete()
    db.query(TodoTask).filter(TodoTask.assignee_id == user_id).update({"assignee_id": None})
    db.query(TodoTask).filter(TodoTask.creator_id == user_id).update({"creator_id": None})
    db.delete(user)
    db.commit()
    return {"ok": True}


@router.put("/users/{user_id}/password")
def reset_password(user_id: int, data: PasswordResetRequest, db: Session = Depends(get_db), _=Depends(verify_admin_token)):
    if len(data.new_password) < 6:
        raise HTTPException(status_code=422, detail="Passwort muss mindestens 6 Zeichen haben")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"ok": True}


@router.put("/users/{user_id}/credentials")
def update_credentials(user_id: int, data: CredentialsUpdateRequest, db: Session = Depends(get_db), _=Depends(verify_admin_token)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    if db.query(User).filter(User.username == data.new_username, User.id != user_id).first():
        raise HTTPException(status_code=400, detail="Benutzername bereits vergeben")
    if data.new_email and db.query(User).filter(User.email == data.new_email, User.id != user_id).first():
        raise HTTPException(status_code=400, detail="E-Mail bereits vergeben")
    user.username = data.new_username
    if data.new_email:
        user.email = data.new_email
    db.commit()
    return {"ok": True}


@router.put("/users/{user_id}/toggle-active")
def toggle_active(user_id: int, db: Session = Depends(get_db), _=Depends(verify_admin_token)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    user.is_active = not user.is_active
    db.commit()
    return {"ok": True, "is_active": user.is_active}


@router.get("/email-config")
def get_email_config(db: Session = Depends(get_db), _=Depends(verify_admin_token)):
    keys = ["smtp_host", "smtp_port", "smtp_user", "smtp_password", "smtp_from", "operator_email"]
    config: dict = {}
    for key in keys:
        row = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        config[key] = row.value if row else str(getattr(settings, key.upper(), ""))
    return config


@router.put("/email-config")
def update_email_config(data: EmailConfigUpdate, db: Session = Depends(get_db), _=Depends(verify_admin_token)):
    for key, value in data.model_dump().items():
        row = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        if row:
            row.value = str(value)
        else:
            db.add(SystemConfig(key=key, value=str(value)))
    db.commit()
    settings.SMTP_HOST = data.smtp_host
    settings.SMTP_PORT = data.smtp_port
    settings.SMTP_USER = data.smtp_user
    settings.SMTP_PASSWORD = data.smtp_password
    settings.SMTP_FROM = data.smtp_from
    settings.OPERATOR_EMAIL = data.operator_email
    return {"ok": True}
