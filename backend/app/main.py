import logging
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt # JWTError, jwtをインポート

# これまでに作成した各モジュールをインポート
from . import crud, models, schemas, auth
from .database import SessionLocal, engine, Base

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# データベースのテーブルを起動時に作成（もし存在しなければ）
Base.metadata.create_all(bind=engine)

# FastAPIアプリケーションのインスタンスを作成
app = FastAPI()

# --- ミドルウェア/イベントハンドラ設定 ---

# フロントエンドからのアクセスを許可するためのCORS設定
origins = [
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    """アプリ起動時の初期データ登録を行います"""
    db = SessionLocal()

    # Create default department if not exists
    department = db.query(models.Department).filter(models.Department.id == 0).first()
    if not department:
        department = models.Department(id=0, name="テスト部署")
        db.add(department)
        db.commit()

    # Ensure default user exists and is assigned to the department
    user = crud.get_user_by_employee_id(db, employee_id="000000")
    if not user:
        user_in = schemas.UserCreate(
            employee_id="000000",
            name="テストユーザー",
            password="pass",
            department_id=0,
        )
        crud.create_user(db=db, user=user_in)
        logger.info("初期テストユーザー(ID:000000)を作成しました。")
    else:
        user.department_id = 0
        # update password to ensure consistency
        user.hashed_password = auth.get_password_hash("pass")
        db.commit()

    db.close()

# --- 依存関係 ---

def get_db():
    """各リクエストでデータベースセッションを生成し、完了後に閉じるための依存関係"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """リクエストのヘッダーからトークンを検証し、現在のユーザー情報を取得する依存関係"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        employee_id: str = payload.get("sub")
        if employee_id is None:
            raise credentials_exception
        token_data = schemas.TokenData(employee_id=employee_id)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_employee_id(db, employee_id=token_data.employee_id)
    if user is None:
        raise credentials_exception
    return user


# --- APIエンドポイント ---

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """ログインしてアクセストークンを取得するエンドポイント"""
    user = crud.get_user_by_employee_id(db, employee_id=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect employee ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.employee_id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    """現在ログインしているユーザーの情報を取得するエンドポイント"""
    return current_user

@app.get("/posts/", response_model=list[schemas.Post])
def read_posts(db: Session = Depends(get_db)):
    """投稿を全件取得するエンドポイント。誰でも見れるように認証はかけない。"""
    posts = crud.get_posts(db)
    return posts

@app.post("/posts/", response_model=schemas.Post, status_code=status.HTTP_201_CREATED)
def create_post_for_user(post: schemas.PostCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    """ログイン中のユーザーとして新しい投稿を作成するエンドポイント"""
    # ここでログ出力を実装すれば、誰がいつ投稿したかのログが取れます
    logger.info("User '%s' is creating a post.", current_user.employee_id)
    return crud.create_post(db=db, post=post, user_id=current_user.id)
