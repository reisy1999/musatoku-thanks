import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv

from jose import JWTError, jwt
from passlib.context import CryptContext

# Load environment variables from a .env file if present
load_dotenv()

# .envファイルから設定を読み込みます
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

expire_str = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(expire_str)
except ValueError as exc:
    raise RuntimeError(
        "ACCESS_TOKEN_EXPIRE_MINUTES must be an integer"
    ) from exc

# パスワードのハッシュ化に関する設定
# bcryptという強力なアルゴリズムを使用します
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """入力されたパスワードが、ハッシュ化されたパスワードと一致するか検証します"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """パスワードをハッシュ化して返します"""
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    """
    アクセストークンを生成します。
    ペイロード(data)に有効期限(exp)を追加してJWTを作成します。
    """
    to_encode = data.copy()
    
    # ★★★計画書通り、トークンの有効期限を30分に設定★★★
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
