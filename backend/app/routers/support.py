import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.support import SupportMessage
from app.schemas.support import SupportCreate, SupportOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/support", tags=["support"])

# URL pattern
_URL_RE = re.compile(
    r'(https?://|ftp://|www\.|'
    r'\b\w+\.(de|com|net|org|io|info|at|ch|eu|co|me|app|dev)\b)',
    re.IGNORECASE
)

# Offensive word list (German + English)
_BAD_WORDS = {
    # German
    'scheiße', 'scheisse', 'scheiß', 'fuck', 'wichser', 'arschloch', 'arsch',
    'hurensohn', 'hure', 'nutte', 'nazi', 'neger', 'fotze', 'ficken', 'fick',
    'vollidiot', 'idiot', 'depp', 'spast', 'pisser', 'bastard', 'dreckssau',
    'schlampe', 'wichsen', 'kacke', 'kackscheiße', 'blödmann', 'trottel',
    # English
    'shit', 'asshole', 'bitch', 'cunt', 'dick', 'pussy', 'cock', 'nigger',
    'faggot', 'retard', 'whore', 'slut', 'motherfucker', 'bastard', 'prick',
    # Sexual / pornographic terms
    'porn', 'porno', 'pornografie', 'sex', 'sexuell', 'nackt', 'nacktbild',
    'penis', 'vagina', 'anal', 'orgie', 'orgasmus', 'erotik', 'dildo',
    'vibrator', 'masturbier', 'masturbation',
}


def _check_content(text: str):
    lower = text.lower()

    if _URL_RE.search(text):
        raise HTTPException(
            status_code=422,
            detail="Links und URLs sind in Nachrichten nicht erlaubt."
        )

    for word in _BAD_WORDS:
        pattern = re.compile(r'\b' + re.escape(word) + r'\b', re.IGNORECASE)
        if pattern.search(lower):
            raise HTTPException(
                status_code=422,
                detail="Deine Nachricht enthält unzulässige Ausdrücke. Bitte formuliere deinen Wunsch respektvoll."
            )


@router.post("", response_model=SupportOut, status_code=201)
def create_message(data: SupportCreate, db: Session = Depends(get_db)):
    _check_content(data.subject)
    _check_content(data.message)

    # Rate limit: max 3 messages per email
    count = db.query(SupportMessage).filter(SupportMessage.email == data.email).count()
    if count >= 3:
        raise HTTPException(
            status_code=429,
            detail="Du hast bereits 3 Nachrichten gesendet. Bitte warte auf eine Antwort."
        )

    msg = SupportMessage(**data.model_dump())
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Send email notification to operator
    try:
        from app.core.email import send_support_notification
        from app.core.config import settings
        if settings.OPERATOR_EMAIL:
            send_support_notification(
                operator_email=settings.OPERATOR_EMAIL,
                category=data.category,
                subject=data.subject,
                message=data.message,
                sender_email=data.email,
            )
    except Exception as e:
        print(f"[SUPPORT] Email notification failed: {e}")

    return msg


@router.get("", response_model=List[SupportOut])
def list_messages(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(SupportMessage).order_by(SupportMessage.created_at.desc()).all()


@router.patch("/{msg_id}/review")
def mark_reviewed(msg_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    msg = db.query(SupportMessage).filter(SupportMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Nachricht nicht gefunden")
    msg.is_reviewed = True
    db.commit()
    return {"ok": True}
