"""
Seed test users — one per role.
Password for all accounts: Pass!@#$

Run from the backend/ directory with the venv activated:
    python seed.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models import user  # noqa: F401 — registers User with Base metadata
from app.models.user import User

TEST_USERS = [
    {"full_name": "Admin User",     "email": "admin@test.com",     "role": "admin"},
    {"full_name": "HR Manager",     "email": "hr@test.com",        "role": "hr"},
    {"full_name": "Tech Recruiter", "email": "recruiter@test.com", "role": "recruiter"},
    {"full_name": "John Applicant", "email": "applicant@test.com", "role": "applicant"},
]

PASSWORD = "Pass!@#$"


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding test users...\n")
    created = skipped = 0

    try:
        for data in TEST_USERS:
            exists = db.query(User).filter(User.email == data["email"]).first()
            if exists:
                print(f"  SKIP  {data['email']}  (already exists)")
                skipped += 1
                continue

            db.add(User(
                full_name=data["full_name"],
                email=data["email"],
                password=hash_password(PASSWORD),
                role=data["role"],
            ))
            print(f"  ADD   {data['email']}  ({data['role']})")
            created += 1

        db.commit()
    finally:
        db.close()

    print(f"\nDone — {created} created, {skipped} skipped.")
    print(f"\nCredentials:")
    print(f"  Password : {PASSWORD}")
    for u in TEST_USERS:
        print(f"  {u['role']:<12} {u['email']}")


if __name__ == "__main__":
    seed()
