import sys
sys.path.append('.')

from app.core.database import SessionLocal
from app.models.order import Order
from datetime import datetime, timedelta

db = SessionLocal()

print("=" * 50)
print("DEBUGGING FINANCIAL DATA")
print("=" * 50)

# All orders
orders = db.query(Order).all()
print(f"\nTotal Orders: {len(orders)}")

# By status
statuses = {}
for o in orders:
    statuses[o.status] = statuses.get(o.status, 0) + 1
print(f"\nOrders by Status:")
for status, count in statuses.items():
    print(f"  {status}: {count}")

# Delivered orders
delivered = db.query(Order).filter(Order.status == 'DELIVERED').all()
print(f"\nDelivered Orders: {len(delivered)}")
total_revenue = sum(o.total_amount for o in delivered)
print(f"Total Revenue from Delivered: {total_revenue} MAD")

# Date range check
print(f"\nOrder Dates (first 10):")
for o in orders[:10]:
    print(f"  {o.order_number}: {o.created_at} - {o.status} - {o.total_amount} MAD")

# Check date range that frontend sends (last 30 days)
end_date = datetime.now()
start_date = end_date - timedelta(days=30)
print(f"\nDate Range (last 30 days):")
print(f"  Start: {start_date}")
print(f"  End: {end_date}")

recent_delivered = [o for o in delivered if o.created_at and o.created_at >= start_date]
print(f"  Delivered in range: {len(recent_delivered)}")
print(f"  Revenue in range: {sum(o.total_amount for o in recent_delivered)} MAD")

db.close()
