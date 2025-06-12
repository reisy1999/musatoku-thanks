from sqlalchemy.orm import Session
from . import models, schemas, auth

# --- User CRUD ---

def get_user_by_employee_id(db: Session, employee_id: str):
    """社員IDを元にユーザーを一件取得します。"""
    return db.query(models.User).filter(models.User.employee_id == employee_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    """ユーザーを新規作成します。"""
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        employee_id=user.employee_id, 
        name=user.name, 
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Post CRUD ---

def get_posts(db: Session, skip: int = 0, limit: int = 100):
    """
    投稿を新しい順に複数件取得します。
    ★★★計画書通り、投稿が0件でもエラーにならず、空のリストを返します★★★
    """
    return db.query(models.Post).order_by(models.Post.created_at.desc()).offset(skip).limit(limit).all()

def create_post(db: Session, post: schemas.PostCreate, user_id: int):
    """投稿を新規作成します。"""
    db_post = models.Post(**post.dict(), author_id=user_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post