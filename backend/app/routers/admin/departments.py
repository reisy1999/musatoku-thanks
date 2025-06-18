from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from ... import crud, schemas
from ...dependencies import get_db, require_admin


router = APIRouter(prefix="/admin/departments", tags=["admin"])


@router.get("/", response_model=list[schemas.Department])
def list_departments(
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    """Return all departments."""
    return crud.get_departments(db)


@router.post("/", response_model=schemas.Department, status_code=status.HTTP_201_CREATED)
def create_department(
    department: schemas.DepartmentCreate,
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    return crud.create_department(db, department)


@router.put("/{dept_id}", response_model=schemas.Department)
def update_department(
    dept_id: int,
    department: schemas.DepartmentCreate,
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    updated = crud.update_department(db, dept_id, department)
    if not updated:
        raise HTTPException(status_code=404, detail="Department not found")
    return updated


@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    success = crud.delete_department(db, dept_id)
    if not success:
        raise HTTPException(status_code=404, detail="Department not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

