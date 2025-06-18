from sqlalchemy.orm import Session, joinedload
from datetime import timezone
from . import models, schemas, auth

# --- User CRUD ---

def get_user_by_employee_id(db: Session, employee_id: str):
    """社員IDを元にユーザーを一件取得します。"""
    return (
        db.query(models.User)
        .options(joinedload(models.User.department))
        .filter(models.User.employee_id == employee_id, models.User.is_active == True)
        .first()
    )

def create_user(db: Session, user: schemas.UserCreate):
    """ユーザーを新規作成します。"""
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        employee_id=user.employee_id,
        name=user.name,
        hashed_password=hashed_password,
        department_id=user.department_id,
        is_admin=user.is_admin,
        is_active=True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_users(db: Session, skip: int = 0, limit: int = 100):
    """Retrieve multiple users."""
    return (
        db.query(models.User)
        .options(joinedload(models.User.department))
        .offset(skip)
        .limit(limit)
        .all()
    )


def search_users(db: Session, query: str, limit: int = 10):
    """Search users by name with partial match."""
    return (
        db.query(models.User)
        .options(joinedload(models.User.department))
        .filter(models.User.name.like(f"%{query}%"))
        .limit(limit)
        .all()
    )

def deactivate_user(db: Session, user_id: int) -> bool:
    """Soft delete a user by setting is_active to False."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return False
    user.is_active = False
    db.commit()
    return True

def get_user(db: Session, user_id: int):
    return (
        db.query(models.User)
        .options(joinedload(models.User.department))
        .filter(models.User.id == user_id)
        .first()
    )

# --- Department CRUD ---

def create_department(db: Session, department: schemas.DepartmentCreate):
    db_dept = models.Department(name=department.name)
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept


def get_departments(db: Session):
    """Retrieve all departments."""
    return db.query(models.Department).order_by(models.Department.id).all()


def update_department(db: Session, dept_id: int, department: schemas.DepartmentCreate):
    db_dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not db_dept:
        return None
    db_dept.name = department.name
    db.commit()
    db.refresh(db_dept)
    return db_dept


def delete_department(db: Session, dept_id: int) -> bool:
    db_dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not db_dept:
        return False
    db.delete(db_dept)
    db.commit()
    return True

# --- Post CRUD ---

def get_posts(db: Session, skip: int = 0, limit: int = 100):
    """
    投稿を新しい順に複数件取得します。
    ★★★計画書通り、投稿が0件でもエラーにならず、空のリストを返します★★★
    """
    posts = (
        db.query(models.Post)
        .options(joinedload(models.Post.mentions))
        .order_by(models.Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    for post in posts:
        if post.created_at and post.created_at.tzinfo is None:
            post.created_at = post.created_at.replace(tzinfo=timezone.utc)
    return posts

def create_post(db: Session, post: schemas.PostCreate, user_id: int):
    """投稿を新規作成します。"""
    db_post = models.Post(content=post.content, author_id=user_id)
    if post.mention_user_ids:
        mentioned_users = (
            db.query(models.User)
            .filter(models.User.id.in_(post.mention_user_ids))
            .all()
        )
        db_post.mentions.extend(mentioned_users)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    if db_post.created_at and db_post.created_at.tzinfo is None:
        db_post.created_at = db_post.created_at.replace(tzinfo=timezone.utc)
    return db_post

def get_posts_mentioned(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """Retrieve posts where the given user is mentioned."""
    posts = (
        db.query(models.Post)
        .join(models.post_mentions)
        .options(joinedload(models.Post.mentions))
        .filter(models.post_mentions.c.user_id == user_id)
        .order_by(models.Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    for post in posts:
        if post.created_at and post.created_at.tzinfo is None:
            post.created_at = post.created_at.replace(tzinfo=timezone.utc)
    return posts


def get_all_posts(db: Session):
    posts = (
        db.query(models.Post)
        .options(
            joinedload(models.Post.author).joinedload(models.User.department),
            joinedload(models.Post.mentions),
        )
        .order_by(models.Post.created_at.desc())
        .all()
    )
    for post in posts:
        if post.created_at and post.created_at.tzinfo is None:
            post.created_at = post.created_at.replace(tzinfo=timezone.utc)
    return posts


def delete_post(db: Session, post_id: int) -> bool:
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        return False
    db.delete(post)
    db.commit()
    return True
