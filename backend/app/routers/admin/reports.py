from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ... import crud, schemas, models
from ...dependencies import get_db, require_admin

router = APIRouter(prefix="/admin/reports", tags=["admin"])


@router.get("/", response_model=list[schemas.AdminPost])
def list_reports(
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    posts = crud.get_reported_posts(db)
    result = []
    for p in posts:
        reports = [
            schemas.ReportForPost(
                id=r.id,
                reporter_name=r.reporter.name if r.reporter else None,
                reason=r.reason,
                status=r.status.value,
            )
            for r in p.reports
        ]
        result.append(
            schemas.AdminPost(
                id=p.id,
                content=p.content,
                created_at=p.created_at,
                author_name=p.author.name if p.author else None,
                department_name=(
                    p.author.department.name if p.author and p.author.department else None
                ),
                mention_user_ids=p.mention_user_ids,
                reports=reports,
                status=p.report_status,
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
