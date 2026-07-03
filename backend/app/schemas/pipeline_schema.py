from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AuthorInfo(BaseModel):
    id: int
    full_name: str
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class NoteCreate(BaseModel):
    content: str


class NoteResponse(BaseModel):
    id: int
    content: str
    author: AuthorInfo
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryResponse(BaseModel):
    id: int
    from_status: Optional[str] = None
    to_status: str
    changed_by: AuthorInfo
    changed_at: datetime

    model_config = {"from_attributes": True}
