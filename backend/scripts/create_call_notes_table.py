import sys
sys.path.append('.')

from sqlalchemy import text
from app.core.database import engine

print("Creating call_notes table...")

with engine.connect() as conn:
    # Drop table to ensure new schema is applied (since we are changing columns)
    conn.execute(text("DROP TABLE IF EXISTS call_notes"))
    conn.commit()
    
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS call_notes (
            id SERIAL PRIMARY KEY,
            lead_id INTEGER NOT NULL REFERENCES leads(id),
            outcome VARCHAR(50) NOT NULL,
            duration INTEGER DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES users(id)
        )
    """))
    
    # Create index for faster queries
    conn.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_call_notes_lead_id ON call_notes(lead_id)
    """))
    conn.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_call_notes_outcome ON call_notes(outcome)
    """))
    
    conn.commit()
    print("✅ call_notes table created!")
