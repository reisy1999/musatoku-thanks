from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Response
import csv
import io
from datetime import datetime, timezone, timedelta

from ...utils import normalize_to_utc

from ... import models, schemas, crud
from ...dependencies import get_db, require_admin


router = APIRouter(prefix="/admin/users", tags=["admin"])


@router.get("/", response_model=list[schemas.AdminUser])
def list_users(
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    """List all registered users with login status."""
    users = crud.get_users(db)
    now = datetime.now(timezone.utc)
    result: list[schemas.AdminUser] = []
    for u in users:
        logged_in = False
        if u.last_seen:
            last_seen = normalize_to_utc(u.last_seen)
            logged_in = now - last_seen <= timedelta(minutes=5)
        result.append(
            schemas.AdminUser(
                id=u.id,
                employee_id=u.employee_id,
                display_name=u.display_name,
                kana_name=u.name,
                department_name=u.department_name,
                is_admin=u.is_admin,
                is_active=u.is_active,
                is_logged_in=logged_in,
            )
        )
    return result


@router.get("/export")
def export_users(
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    """Export user list as CSV."""
    users = crud.get_users(db)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "id",
            "employee_id",
            "display_name",
            "kana_name",
            "department_name",
            "is_admin",
            "is_active",
        ]
    )
    for u in users:
        writer.writerow(
            [
                u.id,
                u.employee_id,
                u.display_name,
                u.name,
                u.department_name or "",
                "管理者" if u.is_admin else "一般",
                "在職" if u.is_active else "退職",
            ]
        )
    output.seek(0)
    headers = {"Content-Disposition": "attachment; filename=users.csv"}
    return StreamingResponse(output, media_type="text/csv", headers=headers)


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
        display_name = (row.get("display_name") or "").strip()
        if not display_name:
            display_name = name
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
            display_name=display_name,
            password=user_id,
            department_id=dept.id,
        )
        crud.create_user(db, user_in)
        added += 1

    return {"added": added, "skipped": skipped}
