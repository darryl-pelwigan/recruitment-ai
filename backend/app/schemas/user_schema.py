from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "applicant"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class ExtendedProfileUpdate(BaseModel):
    phone: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    expected_salary: Optional[float] = None
    salary_currency: Optional[str] = None
    skills: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    years_of_experience: Optional[int] = None


class AdminPasswordChange(BaseModel):
    new_password: str


class AdminRoleChange(BaseModel):
    role: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
    created_at: datetime
    # Extended profile fields
    phone: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    expected_salary: Optional[float] = None
    salary_currency: str = "PHP"
    skills: Optional[str] = None
    resume_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    years_of_experience: Optional[int] = None

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class TokenData(BaseModel):
    email: str
