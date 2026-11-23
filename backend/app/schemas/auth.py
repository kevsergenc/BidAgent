from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ORMResponse(BaseModel):
    """SQLAlchemy modellerinden API yanıtı üretmek için temel şema."""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


class LoginLogResponse(ORMResponse):
    """Kullanıcının giriş geçmişi yanıtı."""

    id: str
    user_id: str = Field(alias="userId")
    ip: str | None = None
    user_agent: str | None = Field(default=None, alias="userAgent")
    login_at: datetime = Field(alias="loginAt")


class UserMeResponse(ORMResponse):
    """Oturum açmış kullanıcının profil yanıtı."""

    id: str
    email: str
    name: str | None = None
    surname: str | None = None
    image: str | None = None
    created_at: datetime = Field(alias="createdAt")
    temp_password: bool = Field(alias="tempPassword")
    last_logins: list[LoginLogResponse] = Field(
        default_factory=list,
        alias="lastLogins",
    )


class AuthMeResponse(BaseModel):
    """Me endpoint'inin standart yanıtı."""

    user: UserMeResponse | None
