from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from . import crud, schemas, auth
from .database import SessionLocal


def get_db():
    """Yield a database session for the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Retrieve the current user based on the access token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        employee_id: str | None = payload.get("sub")
        if employee_id is None:
            raise credentials_exception
        token_data = schemas.TokenData(employee_id=employee_id)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_employee_id(db, employee_id=token_data.employee_id)
    if user is None:
        raise credentials_exception
    return user


async def require_admin(current_user: schemas.User = Depends(get_current_user)) -> schemas.User:
    """Ensure the current user has admin privileges."""
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user

