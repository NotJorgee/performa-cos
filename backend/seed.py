"""
seed.py — Seeds the PerformaCOS database with initial data.
Run from backend/ directory: python seed.py
"""
import sys
import os
import datetime

# Allow importing from app/
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app import models
from app.auth import hash_password
from app.id_generator import generate_evsu_employee_id

DEPARTMENTS = [
    "Administrative and Finance",
    "Campus Director Office",
    "Computer Studies Department",
    "Disbursing / Cashier Office",
    "Education Department",
    "Engineering Department",
    "Extension Service Office",
    "Guidance Office",
    "Hospitality & Tourism Management",
    "HRMDO Office",
    "IGP Office",
    "IPDO Office",
    "Library Office",
    "Maintenance/Janitorial (MESO) Office",
    "Procurement Office",
    "Quality Assurance & Accreditation Office",
    "Registrar Office",
    "Research Office",
    "SASO Office",
    "School Clinic",
    "Sports And Development Office",
    "Technology Department",
]

HR_ACCOUNT = {
    "email": "jorgemikhael.gubantes@evsu.edu.ph",
    "password": "@Cuprum_29",
    "full_name": "Jorge Mikhael R. Gubantes",
    "role": "HR Personnel",
    "job_title": "System Administrator",
    "department_name": "HRMDO Office",
}

INVITE_TOKENS = [
    {"token": "EVSU-INV-COS-84920", "role": "COS Employee"},
    {"token": "EVSU-INV-ADM-39104", "role": "Department Head"},
]


def seed():
    db = SessionLocal()
    try:
        print("=== PerformaCOS Database Seeder ===\n")

        # 1. Seed departments
        print("Seeding departments...")
        dept_map = {}
        for name in DEPARTMENTS:
            existing = db.query(models.Department).filter(models.Department.name == name).first()
            if not existing:
                dept = models.Department(name=name)
                db.add(dept)
                db.flush()
                dept_map[name] = dept.id
                print(f"  + {name}")
            else:
                dept_map[name] = existing.id
                print(f"  ~ {name} (already exists)")
        db.commit()

        # 2. Seed HR account
        print("\nSeeding HR account...")
        existing_hr = db.query(models.UserAccount).filter(
            models.UserAccount.email == HR_ACCOUNT["email"]
        ).first()

        if existing_hr:
            print(f"  ~ HR account already exists: {HR_ACCOUNT['email']}")
            hr_user = existing_hr
        else:
            dept_id = dept_map.get(HR_ACCOUNT["department_name"])
            emp_id = generate_evsu_employee_id(
                db=db,
                full_name=HR_ACCOUNT["full_name"],
                contract_start_date=datetime.date.today(),
            )
            hr_user = models.UserAccount(
                employee_id_number=emp_id,
                full_name=HR_ACCOUNT["full_name"],
                email=HR_ACCOUNT["email"],
                password_hash=hash_password(HR_ACCOUNT["password"]),
                role=HR_ACCOUNT["role"],
                job_title=HR_ACCOUNT["job_title"],
                department_id=dept_id,
                date_appointed=datetime.date.today(),
                is_active=True,
                is_archived=False,
                total_contracts=0,
            )
            db.add(hr_user)
            db.flush()

            # Default notification preferences
            db.add(models.NotificationPreference(user_id=hr_user.id))
            db.commit()
            db.refresh(hr_user)
            print(f"  + Created HR account: {HR_ACCOUNT['email']}")
            print(f"    Employee ID: {hr_user.employee_id_number}")

        # 3. Seed invitation tokens
        print("\nSeeding invitation tokens...")
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)
        for inv in INVITE_TOKENS:
            existing_inv = db.query(models.InvitationToken).filter(
                models.InvitationToken.token == inv["token"]
            ).first()
            if not existing_inv:
                db.add(models.InvitationToken(
                    token=inv["token"],
                    role=inv["role"],
                    expires_at=expires_at,
                    created_by_user_id=hr_user.id,
                ))
                print(f"  + Token: {inv['token']} ({inv['role']})")
            else:
                print(f"  ~ Token already exists: {inv['token']}")
        db.commit()

        print("\n✅ Seed complete!\n")
        print("Login credentials:")
        print(f"  Email:    {HR_ACCOUNT['email']}")
        print(f"  Password: {HR_ACCOUNT['password']}")
        print(f"  Role:     {HR_ACCOUNT['role']}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
