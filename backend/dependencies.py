from typing import Annotated, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.database import get_user_by_id
from jose import JWTError

from backend.security import decode_token

security = HTTPBearer(auto_error=False)


async def get_current_user_id(
    creds: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
) -> UUID:
    if not creds or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(creds.credentials)
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Token invalide")
        return UUID(sub)
    except (ValueError, JWTError, HTTPException):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


async def get_current_user(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
):
    row = await get_user_by_id(user_id)
    if not row:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return row


async def get_current_user_optional(
    creds: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
):
    """Utilisateur JWT si en-tête Bearer valide, sinon None (routes mixtes legacy / dev)."""
    if not creds or not creds.credentials:
        return None
    try:
        payload = decode_token(creds.credentials)
        sub = payload.get("sub")
        if not sub:
            return None
        return await get_user_by_id(UUID(str(sub)))
    except (ValueError, JWTError):
        return None
