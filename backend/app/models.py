from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

# No.7で作成したdatabase.pyから、全てのモデルが継承するBaseクラスをインポートします
from .database import Base

# Association table for Post mentions
post_mentions = Table(
    "post_mentions",
    Base.metadata,
    Column("post_id", ForeignKey("posts.id"), primary_key=True),
    Column("user_id", ForeignKey("users.id"), primary_key=True),
)


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    # backreference to users
    users = relationship("User", back_populates="department")

class User(Base):
    __tablename__ = "users"  # データベース内でのテーブル名を指定

    # カラム（列）の定義
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, default="名無しさん") # ニックネーム機能を見越してデフォルト値設定
    hashed_password = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    is_admin = Column(Boolean, default=False)

    department = relationship("Department", back_populates="users")

    @property
    def department_name(self):
        return self.department.name if self.department else None

    # リレーションシップの定義: UserとPostを連携させます
    # これにより、あるユーザーがした投稿一覧を簡単に取得できるようになります
    posts = relationship("Post", back_populates="author")
    # Posts that mention this user
    mentioned_in = relationship(
        "Post",
        secondary=post_mentions,
        back_populates="mentions",
    )

class Post(Base):
    __tablename__ = "posts"

    # カラム（列）の定義
    id = Column(Integer, primary_key=True, index=True)
    content = Column(String(140), index=True) # 140文字制限を意識
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    
    # 外部キー制約: usersテーブルのidと紐付けます
    author_id = Column(Integer, ForeignKey("users.id"))

    # リレーションシップの定義: PostとUserを連携させます
    # これにより、投稿から投稿主の情報を簡単に取得できるようになります
    author = relationship("User", back_populates="posts")

    # Users mentioned in this post
    mentions = relationship(
        "User",
        secondary=post_mentions,
        back_populates="mentioned_in",
    )

    @property
    def mention_user_ids(self) -> list[int]:
        return [user.id for user in self.mentions]
