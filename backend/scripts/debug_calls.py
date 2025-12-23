import sys
sys.path.append('.')

from app.core.database import SessionLocal
from app.models.call_note import CallNote
from app.models.lead import Lead
from app.models.user import User

print("Import successful")

db = SessionLocal()
try:
    print("Querying CallNotes...")
    notes = db.query(CallNote).all()
    print(f"Found {len(notes)} notes")
    
    if len(notes) > 0:
        print("First note:", notes[0])
        print("First note lead:", notes[0].lead)
        print("First note agent:", notes[0].agent)

    print("Querying Leads...")
    leads = db.query(Lead).limit(1).all()
    if leads:
        print("First lead:", leads[0])
        print("First lead call_notes:", leads[0].call_notes)

except Exception as e:
    print("ERROR OCCURRED:")
    import traceback
    traceback.print_exc()
finally:
    db.close()
