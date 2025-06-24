from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Table,
    Boolean,
    Enum,
)
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timezone
import jaconv

# No.7で作成したdatabase.pyから、全てのモデルが継承するBaseクラスをインポートします
from .database import Base


class ReportStatus(enum.Enum):
    pending = "pending"
    deleted = "deleted"
    ignored = "ignored"


# Association table for Post mentions
post_mentions = Table(
    "post_mentions",
    Base.metadata,
    Column("post_id", ForeignKey("posts.id"), primary_key=True),
    Column("user_id", ForeignKey("users.id"), primary_key=True),
)

# Association table for Post department mentions
post_department_mentions = Table(
    "post_department_mentions",
    Base.metadata,
    Column("post_id", ForeignKey("posts.id"), primary_key=True),
    Column("department_id", ForeignKey("departments.id"), primary_key=True),
)

# Association table for Post likes
post_likes = Table(
    "post_likes",
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
    # kana representation for searching
    name = Column(String, default="名無しさん")
    # full display name in any format
    display_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    # last activity timestamp for login status
    last_seen = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    appreciated_count = Column(Integer, default=0, nullable=False)
    expressed_count = Column(Integer, default=0, nullable=False)
    likes_received = Column(Integer, default=0, nullable=False)

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
    # Posts this user liked
    liked_posts = relationship(
        "Post",
        secondary=post_likes,
        back_populates="likers",
    )


class Post(Base):
    __tablename__ = "posts"

    # カラム（列）の定義
    id = Column(Integer, primary_key=True, index=True)
    content = Column(String(140), index=True)  # 140文字制限を意識
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # 外部キー制約: usersテーブルのidと紐付けます
    author_id = Column(Integer, ForeignKey("users.id"))

    # リレーションシップの定義: PostとUserを連携させます
    # これにより、投稿から投稿主の情報を簡単に取得できるようになります
    author = relationship("User", back_populates="posts")

    # Reports made against this post
    reports = relationship("Report", back_populates="reported_post")

    # Users mentioned in this post
    mentions = relationship(
        "User",
        secondary=post_mentions,
        back_populates="mentioned_in",
    )

    # Users who liked this post
    likers = relationship(
        "User",
        secondary=post_likes,
        back_populates="liked_posts",
    )

    # Departments mentioned in this post
    mention_departments = relationship(
        "Department",
        secondary=post_department_mentions,
    )

    # Soft deletion flag
    is_deleted = Column(Boolean, default=False)

    # Moderation status shared across all reports
    report_status = Column(
        Enum(ReportStatus), default=ReportStatus.pending, nullable=False
    )

    @property
    def mention_user_ids(self) -> list[int]:
        return [user.id for user in self.mentions]

    @property
    def mention_department_ids(self) -> list[int]:
        return [dept.id for dept in self.mention_departments]

    @property
    def mention_user_names(self) -> list[str]:
        names = []
        for user in self.mentions:
            if user.is_active:
                names.append(user.name)
            else:
                names.append("[削除済み]")
        return names

    @property
    def mention_department_names(self) -> list[str]:
        names = []
        for dept in self.mention_departments:
            if dept and dept.name:
                names.append(jaconv.z2h(dept.name, kana=True, ascii=False, digit=False))
        return names

    @property
    def like_count(self) -> int:
        return len(self.likers)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reported_post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    reporter_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(String(255))
    reported_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    reported_post = relationship("Post", back_populates="reports")
    reporter = relationship("User")

    @property
    def status(self) -> ReportStatus:
        return (
            self.reported_post.report_status
            if self.reported_post
            else ReportStatus.pending
        )
