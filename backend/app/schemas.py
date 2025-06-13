from pydantic import BaseModel, constr
from datetime import datetime
from typing import Optional

# --- Post Schemas ---

# 投稿の基本となるスキーマ
class PostBase(BaseModel):
    # constr(max_length=140) で140文字制限をバリデーションします
    content: constr(max_length=140)

# 投稿を作成する際に受け取るデータ型
class PostCreate(PostBase):
    pass

# フロントエンドに返す投稿のデータ型
class Post(PostBase):
    id: int
    created_at: datetime

    # ★★★計画書通り、ここには投稿者の情報を含めません★★★
    # これにより、タイムラインの匿名性を保証します。

    # SQLAlchemyモデルからPydanticモデルへ変換するために必要なおまじない
    class Config:
        from_attributes = True


# --- User Schemas ---

# ユーザーの基本となるスキーマ
class UserBase(BaseModel):
    employee_id: str
    name: str
    department_id: Optional[int] = None

# ユーザーを作成する際に受け取るデータ型（パスワードを含む）
class UserCreate(UserBase):
    password: str

# API経由で返すユーザーのデータ型（パスワードは含めない）
class User(UserBase):
    id: int
    department_name: Optional[str] = None

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
