from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import COOKIE_NAME, decode_access_token
from app.db.session import get_db
from app.models.user import User


def get_current_user(
    db: Session = Depends(get_db),
    token: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> User:
    """JWT cookie üzerinden oturum açmış kullanıcıyı getirir."""

    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Oturum açmanız gerekiyor.",
        )

    
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Oturum geçersiz veya süresi dolmuş.",
        )

    user_id = payload.get("userId")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token içerisinde kullanıcı bilgisi bulunamadı.",
        )

    
    statement = select(User).where(User.id == user_id)
    user = db.scalar(statement)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı.",
        )

    return user
