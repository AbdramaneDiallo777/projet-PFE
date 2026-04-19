from datetime import timedelta
from pathlib import Path
from typing import Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field

from backend.database import create_user, get_user_by_email, update_user_profile
from backend.dependencies import get_current_user
from backend.security import create_access_token, hash_password, verify_password

_AVATAR_DIR = Path(__file__).resolve().parent.parent / "uploads"
_MAX_AVATAR = 5 * 1024 * 1024
_AVATAR_CT = frozenset({"image/jpeg", "image/png", "image/webp", "image/jpg"})
_AVATAR_EXT = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/jpg": ".jpg"}

router = APIRouter(prefix="/auth", tags=["Authentification"])

RoleLiteral = Literal["farmer", "company", "admin", "logistics", "client"]


class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(default="", max_length=200)
    role: RoleLiteral = "farmer"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    country_code: str | None
    phone_number: str | None = None
    location: str | None = None
    image_url: str | None = None


class ProfilePatch(BaseModel):
    full_name: str | None = Field(default=None, max_length=200)
    phone_number: str | None = Field(default=None, max_length=40)
    location: str | None = Field(default=None, max_length=300)
    country_code: str | None = Field(default=None, max_length=8)
    image_url: str | None = Field(default=None, max_length=500)


class UploadedAvatarOut(BaseModel):
    url: str


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterBody) -> TokenResponse:
    existing = await get_user_by_email(body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Cet e-mail est déjà enregistré.")
    ph = hash_password(body.password)
    row = await create_user(body.email, ph, body.full_name, body.role)
    token = create_access_token(
        {"sub": str(row["id"]), "role": row["role"]},
        expires_delta=timedelta(weeks=1),
    )
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()) -> TokenResponse:
    """
    OAuth2 : champs `username` (e-mail) et `password`.
    """
    row = await get_user_by_email(form.username)
    if not row or not verify_password(form.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
        )
    token = create_access_token(
        {"sub": str(row["id"]), "role": row["role"]},
        expires_delta=timedelta(weeks=1),
    )
    return TokenResponse(access_token=token)


def _user_to_out(user: dict) -> UserOut:
    return UserOut(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        country_code=user.get("country_code"),
        phone_number=user.get("phone_number"),
        location=user.get("location"),
        image_url=user.get("image_url"),
    )


@router.get("/me", response_model=UserOut)
async def me_profile(user=Depends(get_current_user)) -> UserOut:
    return _user_to_out(user)


@router.patch("/me", response_model=UserOut)
async def patch_me(body: ProfilePatch, user=Depends(get_current_user)) -> UserOut:
    patch = body.model_dump(exclude_unset=True)
    if not patch:
        return _user_to_out(user)
    row = await update_user_profile(user["id"], patch)
    if not row:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return _user_to_out(dict(row))


@router.post("/upload-avatar", response_model=UploadedAvatarOut)
async def upload_avatar(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
) -> UploadedAvatarOut:
    """Photo de profil — enregistrée sous /uploads, URL relative pour image_url."""
    ct = (file.content_type or "").split(";")[0].strip().lower()
    if ct not in _AVATAR_CT:
        raise HTTPException(
            status_code=400,
            detail="Image JPEG, PNG ou WebP uniquement.",
        )
    raw = await file.read()
    if len(raw) > _MAX_AVATAR:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 5 Mo).")
    _AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    ext = _AVATAR_EXT.get(ct, ".jpg")
    name = f"avatar_{user['id']}_{uuid4().hex}{ext}"
    path = _AVATAR_DIR / name
    path.write_bytes(raw)
    return UploadedAvatarOut(url=f"/uploads/{name}")
