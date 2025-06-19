from pydantic import BaseModel, constr, field_validator
from enum import Enum
import jaconv
from datetime import datetime
from typing import Optional

# --- Post Schemas ---

# 投稿の基本となるスキーマ
class PostBase(BaseModel):
    # constr(max_length=140) で140文字制限をバリデーションします
    content: constr(max_length=140)

# 投稿を作成する際に受け取るデータ型
class PostCreate(PostBase):
    # IDs of users mentioned in this post
    mention_user_ids: list[int] = []
    # IDs of departments whose members are mentioned
    mention_department_ids: list[int] = []

# フロントエンドに返す投稿のデータ型
class Post(PostBase):
    id: int
    created_at: datetime
    mention_user_ids: list[int] = []
    mention_department_ids: list[int] = []
    mention_user_names: list[str] = []
    mention_department_names: list[str] = []
    mention_users: list['MentionTarget'] = []
    mention_departments: list['MentionTarget'] = []
    like_count: int = 0
    liked_by_me: bool = False

    # ★★★計画書通り、ここには投稿者の情報を含めません★★★
    # これにより、タイムラインの匿名性を保証します。

    # SQLAlchemyモデルからPydanticモデルへ変換するために必要なおまじない
    class Config:
        from_attributes = True


class MentionTarget(BaseModel):
    id: int
    name: Optional[str] = None

    class Config:
        from_attributes = True


# --- User Schemas ---

# ユーザーの基本となるスキーマ
class UserBase(BaseModel):
    employee_id: str
    name: str
    department_id: Optional[int] = None

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, v: str) -> str:
        if v is None:
            return v
        return jaconv.z2h(v, kana=True, ascii=False, digit=False)

# ユーザーを作成する際に受け取るデータ型（パスワードを含む）
class UserCreate(UserBase):
    password: str
    is_admin: bool = False


class UserUpdate(BaseModel):
    name: Optional[str] = None
    department_id: Optional[int] = None
    password: Optional[str] = None

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, v: str) -> str | None:
        if v is None:
            return v
        return jaconv.z2h(v, kana=True, ascii=False, digit=False)

# API経由で返すユーザーのデータ型（パスワードは含めない）
class User(UserBase):
    id: int
    department_name: Optional[str] = None
    is_admin: bool = False
    is_active: bool = True

    class Config:
        from_attributes = True


class UserSearchResult(BaseModel):
    """Simplified user representation for search results."""

    id: int
    name: str
    department_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- Department Schemas ---

class DepartmentBase(BaseModel):
    name: str


class DepartmentCreate(DepartmentBase):
    pass


class Department(DepartmentBase):
    id: int

    class Config:
        from_attributes = True


# --- Report Schemas ---

class ReportStatus(str, Enum):
    pending = "pending"
    deleted = "deleted"
    ignored = "ignored"

# --- Admin Post Schema ---

class AdminPost(BaseModel):
    id: int
    content: str
    created_at: datetime
    author_name: str
    department_name: Optional[str] = None
    mention_user_ids: list[int] = []
    mention_department_ids: list[int] = []
    mention_user_names: list[str] = []
    mention_department_names: list[str] = []
    reports: list['ReportForPost'] = []
    status: ReportStatus

    class Config:
        from_attributes = True


# --- Token Schemas ---

# ログイン成功時にフロントエンドに返すアクセストークンの型
class Token(BaseModel):
    access_token: str
    token_type: str

# トークンをデコードした後のデータ（ペイロード）の型
class TokenData(BaseModel):
    employee_id: Optional[str] = None


# --- Report Schemas ---

class ReportCreate(BaseModel):
    reported_post_id: int
    reason: constr(max_length=255)


class ReportOut(BaseModel):
    id: int
    reported_post_id: int
    reporter_user_id: int
    reason: str
    reported_at: datetime
    reporter_name: Optional[str] = None
    post_content: Optional[str] = None
    status: ReportStatus

    class Config:
        from_attributes = True


class AdminReport(BaseModel):
    id: int
    reported_post_id: int
    reporter_user_id: int
    reporter_name: Optional[str] = None
    reason: str
    reported_at: datetime
    post_content: Optional[str] = None
    post_author_id: Optional[int] = None
    post_author_name: Optional[str] = None
    post_created_at: Optional[datetime] = None
    status: ReportStatus

    class Config:
        from_attributes = True


class ReportStatusUpdate(BaseModel):
    status: ReportStatus


class ReportForPost(BaseModel):
    id: int
    reporter_name: Optional[str] = None
    reason: str
    status: ReportStatus

    class Config:
        from_attributes = True
