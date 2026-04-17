from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.storage import StorageItem, StorageTransaction
from app.models.farm import FarmMember
from app.schemas.storage import StorageItemCreate, StorageItemUpdate, StorageItemOut, StorageTransactionCreate, StorageTransactionOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/farms/{farm_id}/storage", tags=["storage"])


def check_access(farm_id: int, user: User, db: Session):
    m = db.query(FarmMember).filter(FarmMember.farm_id == farm_id, FarmMember.user_id == user.id, FarmMember.is_active == True).first()
    if not m:
        raise HTTPException(status_code=403, detail="Kein Zugriff")


@router.get("", response_model=List[StorageItemOut])
def list_storage(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    return db.query(StorageItem).filter(StorageItem.farm_id == farm_id).all()


@router.post("", response_model=StorageItemOut)
def create_storage_item(farm_id: int, data: StorageItemCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    item = StorageItem(**data.model_dump(), farm_id=farm_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=StorageItemOut)
def update_storage_item(farm_id: int, item_id: int, data: StorageItemUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    item = db.query(StorageItem).filter(StorageItem.id == item_id, StorageItem.farm_id == farm_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Lagereintrag nicht gefunden")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_storage_item(farm_id: int, item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    item = db.query(StorageItem).filter(StorageItem.id == item_id, StorageItem.farm_id == farm_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Lagereintrag nicht gefunden")
    db.delete(item)
    db.commit()
    return {"message": "Gelöscht"}


@router.post("/{item_id}/transactions", response_model=StorageTransactionOut)
def add_transaction(farm_id: int, item_id: int, data: StorageTransactionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    item = db.query(StorageItem).filter(StorageItem.id == item_id, StorageItem.farm_id == farm_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Lagereintrag nicht gefunden")
    tx_data = data.model_dump()
    tx_data["storage_item_id"] = item_id
    tx = StorageTransaction(**tx_data, created_by=user.id)
    if data.transaction_type == "in":
        item.current_quantity += data.quantity
    else:
        item.current_quantity = max(0, item.current_quantity - data.quantity)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.get("/{item_id}/transactions", response_model=List[StorageTransactionOut])
def list_transactions(farm_id: int, item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_access(farm_id, user, db)
    return db.query(StorageTransaction).filter(StorageTransaction.storage_item_id == item_id).order_by(StorageTransaction.date.desc()).all()
