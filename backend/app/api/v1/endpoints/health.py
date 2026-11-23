from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Backend servisinin çalışma durumunu kontrol eder."""

    return {
        "status": "healthy",
        "service": "BidAgent API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
