from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.login_log import LoginLog
from app.models.user import User
from app.schemas.auth import AuthMeResponse, UserMeResponse


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.get("/me", response_model=AuthMeResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Oturum açmış kullanıcının bilgilerini ve son girişlerini getirir."""

    statement = (
        select(LoginLog)
        .where(LoginLog.user_id == current_user.id)
        .order_by(LoginLog.login_at.desc())
        .limit(5)
    )

    login_logs = db.scalars(statement).all()

    user_response = UserMeResponse.model_validate(
        {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "surname": current_user.surname,
            "image": current_user.image,
            "created_at": current_user.created_at,
            "temp_password": current_user.temp_password,
            "last_logins": login_logs,
        }
    )

    return {"user": user_response}
