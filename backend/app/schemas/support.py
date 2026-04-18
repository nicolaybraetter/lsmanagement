from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import List


class SupportCreate(BaseModel):
    email: EmailStr
    category: str
    subject: str
    message: str

    @field_validator('category')
    @classmethod
    def validate_category(cls, v):
        allowed = ['Funktionswunsch', 'Fehlermeldung', 'Allgemeines Feedback', 'Sonstiges']
        if v not in allowed:
            raise ValueError('Ungültige Kategorie')
        return v

    @field_validator('subject')
    @classmethod
    def validate_subject(cls, v):
        if len(v.strip()) < 5:
            raise ValueError('Betreff muss mindestens 5 Zeichen lang sein')
        if len(v) > 150:
            raise ValueError('Betreff darf maximal 150 Zeichen lang sein')
        return v.strip()

    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        if len(v.strip()) < 20:
            raise ValueError('Nachricht muss mindestens 20 Zeichen lang sein')
        if len(v) > 2000:
            raise ValueError('Nachricht darf maximal 2000 Zeichen lang sein')
        return v.strip()


class CommentCreate(BaseModel):
    author_email: EmailStr
    text: str

    @field_validator('text')
    @classmethod
    def validate_text(cls, v):
        if len(v.strip()) < 5:
            raise ValueError('Kommentar muss mindestens 5 Zeichen lang sein')
        if len(v) > 1000:
            raise ValueError('Kommentar darf maximal 1000 Zeichen lang sein')
        return v.strip()


class CommentOut(BaseModel):
    id: int
    message_id: int
    author_email: str
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SupportOut(BaseModel):
    id: int
    email: str
    category: str
    subject: str
    message: str
    is_reviewed: bool
    created_at: datetime
    comments: List[CommentOut] = []

    model_config = {"from_attributes": True}
