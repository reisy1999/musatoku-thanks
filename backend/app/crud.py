from sqlalchemy.orm import Session, joinedload
from datetime import timezone
from . import models, schemas, auth

# --- User CRUD ---

def get_user_by_employee_id(db: Session, employee_id: str):
    """社員IDを元にユーザーを一件取得します。"""
    return (
        db.query(models.User)
        .options(joinedload(models.User.department))
        .filter(models.User.employee_id == employee_id)
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
