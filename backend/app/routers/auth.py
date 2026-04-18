from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, Token, LoginRequest, UserUpdate
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Benutzername bereits vergeben")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert")
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    try:
        from app.core.email import send_registration_notification
        send_registration_notification(user.username, user.email)
    except Exception as e:
        print(f"[AUTH] Registration notification failed: {e}")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Ungültige Anmeldedaten")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_profile(update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me")
def delete_account(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.farm import FarmMember
    from app.models.invitation import FarmInvitation
    from app.models.todo import TodoTask

    user_id = current_user.id

    # Remove farm memberships
    db.query(FarmMember).filter(FarmMember.user_id == user_id).delete()
    # Remove invitations (sent and received)
    db.query(FarmInvitation).filter(
        (FarmInvitation.invitee_id == user_id) | (FarmInvitation.inviter_id == user_id)
    ).delete()
    # Unassign todos
    db.query(TodoTask).filter(TodoTask.assignee_id == user_id).update({"assignee_id": None})
    db.query(TodoTask).filter(TodoTask.creator_id == user_id).update({"creator_id": None})

    db.delete(current_user)
    db.commit()
    return {"message": "Konto gelöscht"}
