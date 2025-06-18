from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from ... import crud, schemas
from ...dependencies import get_db, require_admin


router = APIRouter(prefix="/admin/posts", tags=["admin"])


@router.get("/", response_model=list[schemas.AdminPost])
def list_posts(
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    posts = crud.get_all_posts(db)
    result = []
    for p in posts:
        result.append(
            schemas.AdminPost(
                id=p.id,
                content=p.content,
                created_at=p.created_at,
                author_name=p.author.name if p.author else None,
                department_name=p.author.department.name if p.author and p.author.department else None,
                mention_user_ids=p.mention_user_ids,
            )
        )
    return result


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    _: schemas.User = Depends(require_admin),
):
    success = crud.delete_post(db, post_id)
    if not success:
        raise HTTPException(status_code=404, detail="Post not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

