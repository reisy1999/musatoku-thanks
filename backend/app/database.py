from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# データベースファイルの場所を定義します。
# 'sqlite:///./musatoku.db' は、カレントディレクトリにある musatoku.db ファイルを意味します。
SQLALCHEMY_DATABASE_URL = "sqlite:///./musatoku.db"

# SQLAlchemyの「エンジン」を作成します。これがデータベースとの実際の接続点となります。
# `connect_args` はSQLiteを使用する際に推奨される設定です。
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# データベースとの「会話」（セッション）を管理するためのクラスを作成します。
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# データベースのテーブル定義（モデル）を作成する際に、共通の親となるクラスです。
Base = declarative_base()