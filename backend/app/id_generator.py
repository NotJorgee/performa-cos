import re
import datetime
from sqlalchemy.orm import Session
from . import models

def generate_evsu_employee_id(
    db: Session,
    full_name: str,
    contract_start_date: datetime.date or str = None,
    middle_name: str = None,
    first_name: str = None,
    last_name: str = None,
) -> str:
    """
    Dynamically generates a unique EVSU Employee ID formatted as:
    Last Name Initial + MMDDYYYY of the contract start date + First Name Initial(s) + Middle Name Initial.
    Example: 'G10222026JMR' (Gubantes, Oct 22 2026, Jorge Mikhael, R.)

    Collision Rule:
    - The original user receives no numeric suffix (e.g., 'G10222026JMR')
    - Subsequent users with the exact same resulting string receive an incremental suffix (e.g., '-1', '-2')
    """
    # 1. Parse contract start date to MMDDYYYY
    if contract_start_date is None:
        d = datetime.date.today()
    elif isinstance(contract_start_date, str):
        try:
            d = datetime.date.fromisoformat(contract_start_date)
        except ValueError:
            try:
                d = datetime.datetime.strptime(contract_start_date, "%b %d, %Y").date()
            except ValueError:
                d = datetime.date.today()
    elif isinstance(contract_start_date, datetime.datetime):
        d = contract_start_date.date()
    elif isinstance(contract_start_date, datetime.date):
        d = contract_start_date
    else:
        d = datetime.date.today()

    date_str = d.strftime("%m%d%Y")  # MMDDYYYY

    # 2. Parse name initials
    if last_name and first_name:
        last_init = last_name.strip()[0].upper()
        first_inits = "".join(w[0].upper() for w in first_name.strip().split())
        middle_init = middle_name.strip()[0].upper() if middle_name and middle_name.strip() else ""
    else:
        clean_name = re.sub(r'^(Dr\.|Engr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+', '', full_name.strip(), flags=re.I)
        parts = [p.strip('.,') for p in clean_name.split() if p.strip('.,')]
        if not parts:
            parts = ["Employee"]

        if len(parts) == 1:
            last_init = parts[0][0].upper()
            first_inits = parts[0][0].upper()
            middle_init = ""
        else:
            if parts[-1].upper() in ['JR', 'SR', 'II', 'III', 'IV', 'V'] and len(parts) > 2:
                last_part = parts[-2]
                given_parts = parts[:-2]
            else:
                last_part = parts[-1]
                given_parts = parts[:-1]

            # Handle compound surnames (e.g. Del Rosario, Dela Cruz)
            if len(given_parts) >= 1 and given_parts[-1].upper() in ['DEL', 'DELA', 'DE', 'SAN', 'SANTA']:
                last_init = given_parts[-1][0].upper()
                given_parts = given_parts[:-1]
            else:
                last_init = last_part[0].upper()

            if len(given_parts) > 1 and len(given_parts[-1]) == 1:
                middle_init = given_parts[-1][0].upper()
                first_parts = given_parts[:-1]
            elif middle_name and middle_name.strip():
                middle_init = middle_name.strip()[0].upper()
                first_parts = given_parts
            else:
                first_parts = given_parts
                middle_init = ""

            first_inits = "".join(w[0].upper() for w in first_parts if w)

    base_id = f"{last_init}{date_str}{first_inits}{middle_init}"

    # 3. Collision resolution in database
    existing_records = db.query(models.UserAccount).filter(
        models.UserAccount.employee_id_number.like(f"{base_id}%")
    ).all()
    existing_ids = {u.employee_id_number for u in existing_records if u.employee_id_number}

    if base_id not in existing_ids:
        return base_id

    suffix = 1
    while f"{base_id}-{suffix}" in existing_ids:
        suffix += 1
    return f"{base_id}-{suffix}"
