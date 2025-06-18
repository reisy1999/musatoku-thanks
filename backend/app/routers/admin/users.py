from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ... import models, schemas, crud
from ...dependencies import get_db, require_admin


router = APIRouter(prefix="/admin/users", tags=["admin"])


@router.get("/", response_model=list[schemas.User])
def list_users(
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    """List all registered users."""
    return crud.get_users(db)

