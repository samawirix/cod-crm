import sys
import os
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.lead import Lead, LeadStatus

def seed_analytics():
    print("Initializing Analytics Seeder...")
    db = SessionLocal()
    
    try:
        # Get existing products for reference
        products = db.query(Product).all()
        if not products:
            print("Error: No products found. Run seed_products.py first.")
            return

        # Target Months: Oct, Nov, Dec 2025
        end_date = datetime(2025, 12, 18) # Assume "today" is mid-Dec
        start_date = datetime(2025, 10, 1)
        
        generated_orders = 0
        generated_leads = 0
        
        current_date = start_date
        while current_date <= end_date:
            # Vary daily volume slightly
            daily_orders_count = random.randint(0, 5) # 0-5 orders per day
            daily_leads_count = random.randint(2, 8)  # 2-8 leads per day
            
            # Boost December logic (Holiday season?)
            if current_date.month == 12:
                daily_orders_count += 2
                daily_leads_count += 3

            # Generate Orders
            for _ in range(daily_orders_count):
                product = random.choice(products)
                quantity = random.randint(1, 3)
                total_amount = product.selling_price * quantity
                
                # Status distribution
                rand_val = random.random()
                if rand_val < 0.7:
                    status = OrderStatus.DELIVERED
                    payment_status = PaymentStatus.PAID
                elif rand_val < 0.8:
                    status = OrderStatus.RETURNED
                    payment_status = PaymentStatus.FAILED
                elif rand_val < 0.9:
                    status = OrderStatus.CANCELLED
                    payment_status = PaymentStatus.PENDING
                else:
                    status = OrderStatus.PENDING
                    payment_status = PaymentStatus.PENDING
                
                # If date is very recent, more likely to be pending
                days_ago = (end_date - current_date).days
                if days_ago < 3:
                     if random.random() < 0.8:
                        status = OrderStatus.PENDING
                        payment_status = PaymentStatus.PENDING

                order = Order(
                    customer_name=f"Customer {generated_orders}",
                    customer_phone=f"+2126{random.randint(10000000, 99999999)}",
                    city=random.choice(["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir"]),
                    delivery_address="123 Test St",
                    status=status,
                    payment_status=payment_status,
                    total_amount=total_amount,
                    delivery_charges=25.0,
                    created_at=current_date + timedelta(hours=random.randint(9, 20))
                )
                db.add(order)
                db.flush() # get ID
                
                item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    product_sku=product.sku,
                    quantity=quantity,
                    unit_price=product.selling_price,
                    cost_price=product.cost_price,
                    subtotal=total_amount,
                    total=total_amount
                )
                db.add(item)
                generated_orders += 1

            # Generate Leads
            for _ in range(daily_leads_count):
                product = random.choice(products)
                
                lead = Lead(
                    first_name="Lead",
                    last_name=str(generated_leads),
                    email=f"lead{generated_leads}@example.com",
                    phone=f"+2126{random.randint(10000000, 99999999)}",
                    status=random.choice(list(LeadStatus)),
                    source=random.choice(["Facebook", "Instagram", "TikTok", "Google"]),
                    product_interest=product.name,
                    notes="Seeded lead",
                    unit_price=product.selling_price,
                    city=random.choice(["Casablanca", "Rabat", "Marrakech", "Tanger"]),
                    created_at=current_date + timedelta(hours=random.randint(8, 22))
                )
                db.add(lead)
                generated_leads += 1

            current_date += timedelta(days=1)
        
        db.commit()
        print(f"✅ Analytics Seeding Complete!")
        print(f"Generated {generated_orders} orders and {generated_leads} leads from {start_date.date()} to {end_date.date()}")
        
    except Exception as e:
        print(f"Error seeding analytics: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_analytics()
