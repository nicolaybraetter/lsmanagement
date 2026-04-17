from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.todo import TodoStatus, TodoPriority, TodoCategory


class TodoBoardCreate(BaseModel):
    name: str
    description: Optional[str] = None


class TodoBoardOut(BaseModel):
    id: int
    farm_id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TodoTaskCreate(BaseModel):
    board_id: int
    title: str
    description: Optional[str] = None
    status: TodoStatus = TodoStatus.backlog
    priority: TodoPriority = TodoPriority.medium
    category: TodoCategory = TodoCategory.general
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[int] = None
    sort_order: int = 0


class TodoTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TodoStatus] = None
    priority: Optional[TodoPriority] = None
    category: Optional[TodoCategory] = None
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[int] = None
    sort_order: Optional[int] = None


class TodoTaskOut(BaseModel):
    id: int
    board_id: int
    title: str
    description: Optional[str]
    status: TodoStatus
    priority: TodoPriority
    category: TodoCategory
    assignee_id: Optional[int]
    creator_id: int
    due_date: Optional[datetime]
    estimated_hours: Optional[int]
    sort_order: int
    is_template: bool
    created_at: datetime
    updated_at: Optional[datetime]
    assignee_name: Optional[str] = None
    creator_name: Optional[str] = None

    class Config:
        from_attributes = True
