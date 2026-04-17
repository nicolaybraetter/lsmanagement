from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class TodoStatus(str, enum.Enum):
    backlog = "Backlog"
    todo = "Todo"
    in_progress = "In Bearbeitung"
    review = "Überprüfung"
    done = "Erledigt"


class TodoPriority(str, enum.Enum):
    low = "Niedrig"
    medium = "Mittel"
    high = "Hoch"
    urgent = "Dringend"


class TodoCategory(str, enum.Enum):
    field_work = "Feldarbeit"
    machine = "Maschinen"
    animal = "Tiere"
    finance = "Finanzen"
    storage = "Lager"
    biogas = "Biogasanlage"
    harvest = "Ernte"
    maintenance = "Wartung"
    planning = "Planung"
    general = "Allgemein"


class TodoBoard(Base):
    __tablename__ = "todo_boards"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farm = relationship("Farm", back_populates="todo_boards")
    tasks = relationship("TodoTask", back_populates="board")


class TodoTask(Base):
    __tablename__ = "todo_tasks"

    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("todo_boards.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(Enum(TodoStatus), default=TodoStatus.backlog)
    priority = Column(Enum(TodoPriority), default=TodoPriority.medium)
    category = Column(Enum(TodoCategory), default=TodoCategory.general)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    estimated_hours = Column(Integer)
    sort_order = Column(Integer, default=0)
    is_template = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    board = relationship("TodoBoard", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_todos", foreign_keys=[assignee_id])
    creator = relationship("User", back_populates="created_todos", foreign_keys=[creator_id])
