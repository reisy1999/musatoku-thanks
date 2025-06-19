from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ... import crud, schemas, models
from ...dependencies import get_db, require_admin

router = APIRouter(prefix="/admin/reports", tags=["admin"])


@router.get("/", response_model=list[schemas.AdminReport])
def list_reports(
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    reports = crud.get_reports(db)
    result = []
    for r in reports:
        result.append(
            schemas.AdminReport(
                id=r.id,
                reported_post_id=r.reported_post_id,
                reporter_user_id=r.reporter_user_id,
                reporter_name=r.reporter.name if r.reporter else None,
                reason=r.reason,
                reported_at=r.reported_at,
                status=r.status.value,
                post_content=r.reported_post.content if r.reported_post else None,
                post_author_id=(
                    r.reported_post.author.id
                    if r.reported_post and r.reported_post.author
                    else None
                ),
                post_author_name=(
                    r.reported_post.author.name
                    if r.reported_post and r.reported_post.author
                    else None
                ),
                post_created_at=r.reported_post.created_at if r.reported_post else None,
            )
        )
    return result


@router.patch("/{report_id}", response_model=schemas.AdminReport)
def update_report(
    report_id: int,
    body: schemas.ReportStatusUpdate,
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    updated = crud.update_report_status(db, report_id, models.ReportStatus(body.status))
    if not updated:
        raise HTTPException(status_code=404, detail="Report not found")
    return schemas.AdminReport(
        id=updated.id,
        reported_post_id=updated.reported_post_id,
        reporter_user_id=updated.reporter_user_id,
        reporter_name=updated.reporter.name if updated.reporter else None,
        reason=updated.reason,
        reported_at=updated.reported_at,
        status=updated.status.value,
        post_content=updated.reported_post.content if updated.reported_post else None,
        post_author_id=(updated.reported_post.author.id if updated.reported_post and updated.reported_post.author else None),
        post_author_name=(updated.reported_post.author.name if updated.reported_post and updated.reported_post.author else None),
        post_created_at=updated.reported_post.created_at if updated.reported_post else None,
    )
