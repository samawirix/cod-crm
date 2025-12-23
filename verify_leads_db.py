
import sys
import os
sys.path.append(os.getcwd())
from app.core.database import SessionLocal
from app.models.lead import Lead, LeadStatus, LeadSource
from datetime import datetime
import traceback

def test_db():
    db = SessionLocal()
    try:
        print("1. Querying all leads...")
        leads = db.query(Lead).limit(5).all()
        print(f"Found {len(leads)} leads")
        if leads:
            l = leads[0]
            print(f"Sample Lead: {l.id}, status={l.status}, source={l.source}")
            print(f"Sample Lead Created At: {l.created_at} (type: {type(l.created_at)})")
        
        print("\n2. Testing Date Filter Logic...")
        date_from = "2024-01-01"
        start_dt = datetime.strptime(date_from, "%Y-%m-%d")
        q = db.query(Lead).filter(Lead.created_at >= start_dt)
        print(f"Leads since 2024: {q.count()}")
        
        print("\n3. Testing Pydantic Validation Simulation...")
        # mimic conversion
        for l in leads:
            data = {
                "id": l.id,
                "first_name": l.first_name,
                "full_name": l.full_name,
                "phone": l.phone,
                "source": l.source.value if l.source else "OTHER",
                "status": l.status.value if l.status else "NEW",
                "lead_score": l.lead_score,
                "created_at": l.created_at,
                "updated_at": l.updated_at,
                "total_amount": l.total_amount
            }
            # print(data)
            
        print("\nSUCCESS: DB Logic seems fine.")
        
    except Exception as e:
        print(f"\nCRASH: {e}")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_db()
