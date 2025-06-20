from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Response
import csv
import io

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


@router.post("/import")
async def import_users(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    """Import users from a CSV file."""
    content = await file.read()
    csv_file = io.StringIO(content.decode("utf-8"))
    reader = csv.DictReader(csv_file)

    required_fields = {"user_id", "name", "department", "email"}
    if not reader.fieldnames or not required_fields.issubset(reader.fieldnames):
        raise HTTPException(status_code=400, detail="Invalid CSV headers")

    added = 0
    skipped = 0
    for row in reader:
        user_id = (row.get("user_id") or "").strip()
        name = (row.get("name") or "").strip()
        department_name = (row.get("department") or "").strip()
        email = (row.get("email") or "").strip()

        if not user_id or not name or not department_name or not email:
            skipped += 1
            continue

        if crud.get_user_by_employee_id(db, user_id):
            skipped += 1
            continue

        dept = (
            db.query(models.Department)
            .filter(models.Department.name == department_name)
            .first()
        )
        if not dept:
            dept = models.Department(name=department_name)
            db.add(dept)
            db.commit()
            db.refresh(dept)

        user_in = schemas.UserCreate(
            employee_id=user_id,
            name=name,
            password=user_id,
            department_id=dept.id,
        )
        crud.create_user(db, user_in)
        added += 1

    return {"added": added, "skipped": skipped}

