import sqlite3
import os

db_path = "cod_crm.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Add columns to leads table if they don't exist
    try:
        cursor.execute("ALTER TABLE leads ADD COLUMN call_count INTEGER DEFAULT 0")
        print("Added call_count to leads")
    except:
        print("call_count already exists")
    
    try:
        cursor.execute("ALTER TABLE leads ADD COLUMN callback_date DATETIME")
        print("Added callback_date to leads")
    except:
        print("callback_date already exists")
    
    try:
        cursor.execute("ALTER TABLE leads ADD COLUMN delivered_orders INTEGER DEFAULT 0")
        print("Added delivered_orders to leads")
    except:
        print("delivered_orders already exists")
    
    try:
        cursor.execute("ALTER TABLE leads ADD COLUMN returned_orders INTEGER DEFAULT 0")
        print("Added returned_orders to leads")
    except:
        print("returned_orders already exists")
    
    # Add user_id to call_notes if it doesn't exist
    try:
        cursor.execute("ALTER TABLE call_notes ADD COLUMN user_id INTEGER")
        print("Added user_id to call_notes")
    except:
        print("user_id already exists in call_notes")
    
    # Add callback_scheduled to call_notes if it doesn't exist
    try:
        cursor.execute("ALTER TABLE call_notes ADD COLUMN callback_scheduled DATETIME")
        print("Added callback_scheduled to call_notes")
    except:
        print("callback_scheduled already exists")
    
    conn.commit()
    conn.close()
    print("\n✅ Migration complete!")
else:
    print(f"Database not found at {db_path}")
