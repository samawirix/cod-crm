import sys
import os

# Add backend directory to path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.lead import Lead

db = SessionLocal()

print("=" * 50)
print("DEBUGGING LEADS")
print("=" * 50)

leads = db.query(Lead).all()
print(f"\nTotal leads: {len(leads)}")

# Count by status
status_counts = {}
for lead in leads:
    status = lead.status or 'NULL'
    # Convert enum to string if needed
    if hasattr(status, 'value'):
        status = status.value
    status_counts[status] = status_counts.get(status, 0) + 1

print("\nLeads by Status:")
for status, count in sorted(status_counts.items()):
    print(f"  '{status}': {count}")

# Show first 10 leads
print("\nFirst 10 leads:")
for lead in leads[:10]:
    status = lead.status
    if hasattr(status, 'value'):
        status = status.value
    print(f"  ID:{lead.id} | {lead.first_name} {lead.last_name or ''} | Status: '{status}' | Phone: {lead.phone}")

# Check for case issues
print("\nChecking for case issues:")
try:
    new_leads = db.query(Lead).filter(Lead.status == 'NEW').all()
    print(f"  Status == 'NEW': {len(new_leads)} leads")
    
    # Check if ilike is available (Postgres) or emulate for SQLite
    try:
        new_leads_upper = db.query(Lead).filter(Lead.status.ilike('new')).all()
        print(f"  Status ILIKE 'new': {len(new_leads_upper)} leads")
    except Exception as e:
        print(f"  Status ILIKE 'new': Failed (probably SQLite restrictions or Enum type) - {e}")
        
except Exception as e:
    print(f"Error querying specific statuses: {e}")

db.close()
