from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.todo import TodoBoard, TodoTask
from app.models.farm import FarmMember, Farm
from app.models.user import User
from app.models.notification import Notification
from app.schemas.todo import TodoBoardCreate, TodoBoardOut, TodoTaskCreate, TodoTaskUpdate, TodoTaskOut
from app.core.security import get_current_user

router = APIRouter(prefix="/api/farms/{farm_id}/todos", tags=["todos"])


def check_access(farm_id: int, user: User, db: Session):
    m = db.query(FarmMember).filter(FarmMember.farm_id == farm_id, FarmMember.user_id == user.id, FarmMember.is_active == True).first()
    if not m:
        raise HTTPException(status_code=403, detail="Kein Zugriff")


def enrich_task(task: TodoTask, db: Session) -> TodoTaskOut:
    assignee_name = None
    creator_name = None
    if task.assignee_id:
        a = db.query(User).filter(User.id == task.assignee_id).first()
        assignee_name = a.full_name or a.username if a else None
    c = db.query(User).filter(User.id == task.creator_id).first()
    creator_name = c.full_name or c.username if c else None
    return TodoTaskOut(
        id=task.id, board_id=task.board_id, title=task.title, description=task.description,
        status=task.status, priority=task.priority, category=task.category,
        assignee_id=task.assignee_id, creator_id=task.creator_id, due_date=task.due_date,
        estimated_hours=task.estimated_hours, sort_order=task.sort_order, is_template=task.is_template,
        created_at=task.created_at, updated_at=task.updated_at,
        assignee_name=assignee_name, creator_name=creator_name
    )


def _notify_assignee(task: TodoTask, farm_id: int, assigner: User, db: Session):
    """Create in-app notification and send email when a task is assigned to someone."""
    if not task.assignee_id or task.assignee_id == assigner.id:
        return

    assignee = db.query(User).filter(User.id == task.assignee_id).first()
    if not assignee:
        return

    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    farm_name = farm.name if farm else f"Hof #{farm_id}"
    assigner_name = assigner.full_name or assigner.username

    # In-app notification
    notif = Notification(
        user_id=task.assignee_id,
        farm_id=farm_id,
        type="task_assigned",
        title=f"Neue Aufgabe: {task.title}",
        message=f"{assigner_name} hat dir die Aufgabe auf dem Hof \"{farm_name}\" zugewiesen.",
        related_id=task.id,
    )
    db.add(notif)
    db.commit()

    # Email notification
    try:
        from app.core.email import send_task_assignment
        board = db.query(TodoBoard).filter(TodoBoard.id == task.board_id).first()
        board_name = board.name if board else "Board"
        send_task_assignment(
            assignee_email=assignee.email,
            assignee_name=assignee.full_name or assignee.username,
            assigner_name=assigner_name,
            farm_name=farm_name,
            task_title=task.title,
            board_name=board_name,
        )
    except Exception as e:
        print(f"[NOTIFY] Email failed: {e}")


@router.get("/boards", response_model=List[TodoBoardOut])
def list_boards(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    return db.query(TodoBoard).filter(TodoBoard.farm_id == farm_id, TodoBoard.is_active == True).all()


@router.post("/boards", response_model=TodoBoardOut)
def create_board(farm_id: int, data: TodoBoardCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    board = TodoBoard(**data.model_dump(), farm_id=farm_id)
    db.add(board)
    db.commit()
    db.refresh(board)
    return board


@router.get("/boards/{board_id}/tasks", response_model=List[TodoTaskOut])
def list_tasks(farm_id: int, board_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    tasks = db.query(TodoTask).filter(TodoTask.board_id == board_id).order_by(TodoTask.sort_order, TodoTask.created_at).all()
    return [enrich_task(t, db) for t in tasks]


@router.post("/boards/{board_id}/tasks", response_model=TodoTaskOut)
def create_task(farm_id: int, board_id: int, data: TodoTaskCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    task_data = data.model_dump()
    task_data["board_id"] = board_id
    task_data["creator_id"] = user.id
    task = TodoTask(**task_data)
    db.add(task)
    db.commit()
    db.refresh(task)
    _notify_assignee(task, farm_id, user, db)
    return enrich_task(task, db)


@router.put("/boards/{board_id}/tasks/{task_id}", response_model=TodoTaskOut)
def update_task(farm_id: int, board_id: int, task_id: int, data: TodoTaskUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    task = db.query(TodoTask).filter(TodoTask.id == task_id, TodoTask.board_id == board_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")

    old_assignee_id = task.assignee_id
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(task, k, v)
    db.commit()
    db.refresh(task)

    # Notify only if assignee changed to a new person
    if task.assignee_id and task.assignee_id != old_assignee_id:
        _notify_assignee(task, farm_id, user, db)

    return enrich_task(task, db)


@router.delete("/boards/{board_id}/tasks/{task_id}")
def delete_task(farm_id: int, board_id: int, task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    task = db.query(TodoTask).filter(TodoTask.id == task_id, TodoTask.board_id == board_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    db.delete(task)
    db.commit()
    return {"message": "Aufgabe gelöscht"}


@router.put("/tasks/{task_id}/assign")
def assign_task(farm_id: int, task_id: int, assignee_id: int = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    task = db.query(TodoTask).filter(TodoTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    old_assignee_id = task.assignee_id
    task.assignee_id = assignee_id if assignee_id else user.id
    db.commit()
    db.refresh(task)
    if task.assignee_id and task.assignee_id != old_assignee_id:
        _notify_assignee(task, farm_id, user, db)
    return {"message": "Aufgabe zugewiesen"}
