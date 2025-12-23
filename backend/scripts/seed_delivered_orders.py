"""
Seed script to create delivered orders for financial dashboard data
"""
import sys
sys.path.append('.')

from datetime import datetime, timedelta
import random
from app.core.database import SessionLocal
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.lead import Lead

db = SessionLocal()

print("Creating delivered orders for financial data...")

# Get existing products and leads
products = db.query(Product).filter(Product.is_active == True).all()
leads = db.query(Lead).all()

if not products:
    print("❌ No products found. Run seed_products.py first.")
    db.close()
    exit()

if not leads:
    print("❌ No leads found. Run seed_leads.py first.")
    db.close()
    exit()

print(f"Found {len(products)} products and {len(leads)} leads")

# Check for existing delivered orders
existing_count = db.query(Order).filter(Order.status == OrderStatus.DELIVERED).count()
print(f"Existing delivered orders: {existing_count}")

# Create 10 delivered orders over the past 30 days
for i in range(10):
    lead = random.choice(leads)
    days_ago = random.randint(1, 30)
    order_date = datetime.now() - timedelta(days=days_ago)
    
    # Select 1-3 random products
    order_products = random.sample(products, min(random.randint(1, 3), len(products)))
    
    # Calculate totals
    subtotal = 0
    items_data = []
    product_names = []
    for prod in order_products:
        qty = random.randint(1, 3)
        item_total = float(prod.selling_price) * qty
        subtotal += item_total
        items_data.append({
            'product': prod,
            'quantity': qty,
            'total': item_total
        })
        product_names.append(prod.name)
    
    delivery_charges = 30.0 if subtotal < 500 else 0.0
    total = subtotal + delivery_charges
    
    # Create order with correct field names matching Order model
    order = Order(
        lead_id=lead.id,
        order_number=f"ORD-{10000 + existing_count + i}",
        customer_name=f"{lead.first_name} {lead.last_name or ''}".strip(),
        customer_phone=lead.phone,
        customer_email=lead.email,
        delivery_address=lead.address or "123 Street, City",
        city=lead.city or "Casablanca",
        postal_code="20000",
        product_name=", ".join(product_names),
        quantity=sum(item['quantity'] for item in items_data),
        unit_price=subtotal / sum(item['quantity'] for item in items_data) if items_data else 0,
        subtotal=subtotal,
        delivery_charges=delivery_charges,
        total_amount=total,
        status=OrderStatus.DELIVERED,
        payment_status=PaymentStatus.PAID,
        is_confirmed=True,
        confirmed_by="Admin",
        confirmed_at=order_date,
        tracking_number=f"TRK{random.randint(100000, 999999)}",
        delivery_partner="Express Delivery",
        delivery_attempts=1,
        shipped_at=order_date + timedelta(hours=12),
        delivered_at=order_date + timedelta(days=2),
        payment_collected=True,
        payment_collected_at=order_date + timedelta(days=2),
        cash_collected=total,
        notes=f"Test delivered order {i+1}",
        created_at=order_date,
        updated_at=order_date + timedelta(days=2)
    )
    db.add(order)
    db.flush()
    
    # Create order items
    for item_data in items_data:
        item = OrderItem(
            order_id=order.id,
            product_id=item_data['product'].id,
            product_name=item_data['product'].name,
            product_sku=item_data['product'].sku,
            unit_price=float(item_data['product'].selling_price),
            cost_price=float(item_data['product'].cost_price),
            quantity=item_data['quantity'],
            subtotal=item_data['total'],
            discount=0,
            total=item_data['total']
        )
        db.add(item)
    
    print(f"  ✅ Created: {order.order_number} - {total:.2f} MAD ({len(items_data)} items)")

db.commit()
db.close()

print("\n✅ Delivered orders created! Financial dashboard should now show data.")
