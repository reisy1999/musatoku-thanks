from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

# No.7で作成したdatabase.pyから、全てのモデルが継承するBaseクラスをインポートします
from .database import Base


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

    department = relationship("Department", back_populates="users")

    @property
    def department_name(self):
        return self.department.name if self.department else None

    # リレーションシップの定義: UserとPostを連携させます
    # これにより、あるユーザーがした投稿一覧を簡単に取得できるようになります
    posts = relationship("Post", back_populates="author")

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
