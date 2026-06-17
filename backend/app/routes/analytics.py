from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.schemas.analytics_schema import DashboardAnalytics
from app.services.analytics_service import get_dashboard_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])
MANAGE_ROLES = require_roles("admin", "hr", "recruiter")


@router.get("/dashboard", response_model=DashboardAnalytics)
def dashboard_analytics(
    current_user: Annotated[object, Depends(MANAGE_ROLES)],
    db: Annotated[Session, Depends(get_db)],
):
    return get_dashboard_analytics(db, current_user.id, current_user.role)
