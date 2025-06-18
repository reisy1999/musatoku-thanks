from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ... import crud, schemas
from ...dependencies import get_db, require_admin

router = APIRouter(prefix="/admin/reports", tags=["admin"])


@router.get("/", response_model=list[schemas.ReportOut])
def list_reports(
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    reports = crud.get_reports(db)
    result = []
    for r in reports:
        result.append(
            schemas.ReportOut(
                id=r.id,
                reported_post_id=r.reported_post_id,
                reporter_user_id=r.reporter_user_id,
                reason=r.reason,
                reported_at=r.reported_at,
                reporter_name=r.reporter.name if r.reporter else None,
                post_content=r.reported_post.content if r.reported_post else None,
            )
        )
    return result
