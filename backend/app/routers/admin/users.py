from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Response

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


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    """Deactivate a user account."""
    success = crud.deactivate_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

