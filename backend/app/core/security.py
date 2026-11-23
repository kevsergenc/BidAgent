from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import get_settings


COOKIE_NAME = "bidagent_token"


def hash_password(password: str) -> str:
    """Şifreyi bcrypt ile hash'ler."""

    password_bytes = password.encode("utf-8")

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt(rounds=10),
    )

    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Girilen şifreyi mevcut bcrypt hash'i ile karşılaştırır."""

    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def create_access_token(
    user_id: str,
    email: str,
    name: str | None = None,
) -> str:
    """Next.js uygulamasıyla uyumlu JWT üretir."""

    settings = get_settings()

    if not settings.jwt_secret:
        raise RuntimeError("BIDAGENT_JWT_SECRET yapılandırılmamış.")

    now = datetime.now(timezone.utc)

    payload: dict[str, Any] = {
        "userId": user_id,
        "email": email,
        "name": name,
        "iat": now,
        "exp": now + timedelta(days=settings.jwt_expire_days),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> dict[str, Any] | None:
    """JWT imzasını ve geçerlilik süresini doğrular."""

    settings = get_settings()

    if not settings.jwt_secret:
        raise RuntimeError("BIDAGENT_JWT_SECRET yapılandırılmamış.")

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )

        if not payload.get("userId") or not payload.get("email"):
            return None

        return payload

    except jwt.InvalidTokenError:
        return None
