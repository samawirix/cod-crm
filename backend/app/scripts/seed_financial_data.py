"""
Seed financial transaction data for analytics
Generates realistic revenue and expense transactions
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import random

from app.core.database import SessionLocal, engine
from app.models.base import Base
# Import all models to register them with Base.metadata
from app.models import (
    User, Lead, Order, Product, Transaction,
    Courier, Shipment, Bordereau, Blacklist
)


def get_date_range():
    """Get date range for last 90 days"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=90)
    return start_date, end_date


def generate_date_between(start_date, end_date):
    """Generate random date between start and end"""
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randint(0, days_between)
    return start_date + timedelta(days=random_days)


def seed_revenue_transactions(db: Session):
    """Create revenue transactions from existing orders"""
    print("\n📊 Seeding Revenue Transactions...")
    
    # Get existing orders
    orders = db.query(Order).all()
    
    if not orders:
        print("⚠️  No orders found. Creating synthetic revenue data...")
        # Create synthetic revenue data
        start_date, end_date = get_date_range()
        admin_user = db.query(User).first()
        user_id = admin_user.id if admin_user else None
        
        for i in range(200):
            transaction_date = generate_date_between(start_date, end_date)
            amount = random.uniform(200, 2000)
            
            revenue_transaction = Transaction(
                type="revenue",
                category="order_revenue",
                amount=round(amount, 2),
                description=f"Order Revenue - Synthetic #{i+1}",
                order_id=None,
                transaction_date=transaction_date,
                created_by=user_id
            )
            db.add(revenue_transaction)
            
            # COGS (70% of revenue)
            cogs_transaction = Transaction(
                type="expense",
                category="product_cost",
                amount=round(amount * 0.7, 2),
                description=f"COGS - Synthetic #{i+1}",
                order_id=None,
                transaction_date=transaction_date,
                created_by=user_id
            )
            db.add(cogs_transaction)
        
        db.commit()
        print(f"✅ Created 200 synthetic revenue transactions")
        return
    
    start_date, end_date = get_date_range()
    revenue_count = 0
    
    for order in orders:
        # Create revenue transaction for each order
        product_cost = (order.total_amount or 0) * 0.70  # 70% cost
        revenue = order.total_amount or 0
        
        if revenue <= 0:
            continue
            
        # Use order date or random date in last 90 days
        transaction_date = order.created_at if order.created_at and order.created_at >= start_date else generate_date_between(start_date, end_date)
        
        # Revenue from order
        revenue_transaction = Transaction(
            type="revenue",
            category="order_revenue",
            amount=revenue,
            description=f"Order #{order.id} - {order.status}",
            order_id=order.id,
            transaction_date=transaction_date,
            created_by=None
        )
        db.add(revenue_transaction)
        
        # Cost of goods sold (expense)
        cogs_transaction = Transaction(
            type="expense",
            category="product_cost",
            amount=product_cost,
            description=f"COGS for Order #{order.id}",
            order_id=order.id,
            transaction_date=transaction_date,
            created_by=None
        )
        db.add(cogs_transaction)
        
        # Shipping cost (expense)
        if hasattr(order, 'shipping_cost') and order.shipping_cost and order.shipping_cost > 0:
            shipping_transaction = Transaction(
                type="expense",
                category="shipping",
                amount=order.shipping_cost,
                description=f"Shipping for Order #{order.id}",
                order_id=order.id,
                transaction_date=transaction_date,
                created_by=None
            )
            db.add(shipping_transaction)
        
        revenue_count += 1
    
    db.commit()
    print(f"✅ Created {revenue_count} revenue transactions from orders")


def seed_marketing_expenses(db: Session):
    """Create marketing expense transactions"""
    print("\n📢 Seeding Marketing Expenses...")
    
    start_date, end_date = get_date_range()
    
    marketing_campaigns = [
        {"name": "Facebook Ads - Beauty Products", "daily_budget": 500},
        {"name": "Instagram Influencer Campaign", "daily_budget": 800},
        {"name": "Google Ads - Hair Care", "daily_budget": 600},
        {"name": "TikTok Ads - Skincare", "daily_budget": 400},
        {"name": "Email Marketing Campaign", "daily_budget": 100},
    ]
    
    admin_user = db.query(User).first()
    user_id = admin_user.id if admin_user else None
    
    expense_count = 0
    
    # Generate weekly marketing expenses for last 90 days
    current_date = start_date
    while current_date <= end_date:
        for campaign in marketing_campaigns:
            # Weekly spend (7 days * daily budget)
            weekly_amount = campaign["daily_budget"] * 7 * random.uniform(0.8, 1.2)
            
            transaction = Transaction(
                type="expense",
                category="marketing",
                amount=round(weekly_amount, 2),
                description=campaign["name"],
                transaction_date=current_date,
                created_by=user_id
            )
            db.add(transaction)
            expense_count += 1
        
        current_date += timedelta(days=7)  # Weekly
    
    db.commit()
    print(f"✅ Created {expense_count} marketing expense transactions")


def seed_operational_expenses(db: Session):
    """Create operational expense transactions"""
    print("\n🏢 Seeding Operational Expenses...")
    
    start_date, end_date = get_date_range()
    
    admin_user = db.query(User).first()
    user_id = admin_user.id if admin_user else None
    
    operational_costs = [
        {"name": "Office Rent", "amount": 15000, "frequency": "monthly"},
        {"name": "Staff Salaries", "amount": 45000, "frequency": "monthly"},
        {"name": "Utilities (Electric, Water, Internet)", "amount": 3000, "frequency": "monthly"},
        {"name": "Software Subscriptions", "amount": 2500, "frequency": "monthly"},
        {"name": "Warehouse Rent", "amount": 20000, "frequency": "monthly"},
        {"name": "Insurance", "amount": 5000, "frequency": "monthly"},
        {"name": "Office Supplies", "amount": 1500, "frequency": "monthly"},
    ]
    
    expense_count = 0
    
    # Generate monthly operational expenses
    current_date = start_date
    while current_date <= end_date:
        for cost in operational_costs:
            # Add some variation (+/- 10%)
            amount = cost["amount"] * random.uniform(0.9, 1.1)
            
            transaction = Transaction(
                type="expense",
                category="operations",
                amount=round(amount, 2),
                description=cost["name"],
                transaction_date=current_date,
                created_by=user_id
            )
            db.add(transaction)
            expense_count += 1
        
        current_date += timedelta(days=30)  # Monthly
    
    db.commit()
    print(f"✅ Created {expense_count} operational expense transactions")


def seed_additional_expenses(db: Session):
    """Create miscellaneous expense transactions"""
    print("\n💼 Seeding Additional Expenses...")
    
    start_date, end_date = get_date_range()
    
    admin_user = db.query(User).first()
    user_id = admin_user.id if admin_user else None
    
    misc_expenses = [
        "Bank Fees",
        "Payment Gateway Fees",
        "Customer Returns Processing",
        "Equipment Maintenance",
        "Professional Services (Legal, Accounting)",
        "Employee Training",
        "Business Travel",
    ]
    
    expense_count = 0
    
    # Generate 20-30 random miscellaneous expenses over 90 days
    for _ in range(random.randint(20, 30)):
        expense = random.choice(misc_expenses)
        amount = random.uniform(500, 5000)
        date = generate_date_between(start_date, end_date)
        
        transaction = Transaction(
            type="expense",
            category="miscellaneous",
            amount=round(amount, 2),
            description=expense,
            transaction_date=date,
            created_by=user_id
        )
        db.add(transaction)
        expense_count += 1
    
    db.commit()
    print(f"✅ Created {expense_count} miscellaneous expense transactions")


def print_summary(db: Session):
    """Print summary of financial data"""
    print("\n" + "="*60)
    print("📊 FINANCIAL DATA SUMMARY")
    print("="*60)
    
    # Revenue
    total_revenue = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "revenue"
    ).scalar() or 0
    
    # Expenses
    total_expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "expense"
    ).scalar() or 0
    
    # Profit
    profit = total_revenue - total_expenses
    profit_margin = (profit / total_revenue * 100) if total_revenue > 0 else 0
    
    # Transaction counts
    revenue_count = db.query(Transaction).filter(
        Transaction.type == "revenue"
    ).count()
    
    expense_count = db.query(Transaction).filter(
        Transaction.type == "expense"
    ).count()
    
    print(f"\n💰 Total Revenue:        {total_revenue:,.2f} MAD")
    print(f"💸 Total Expenses:       {total_expenses:,.2f} MAD")
    print(f"📈 Net Profit:           {profit:,.2f} MAD")
    print(f"📊 Profit Margin:        {profit_margin:.2f}%")
    print(f"\n📝 Revenue Transactions: {revenue_count}")
    print(f"📝 Expense Transactions: {expense_count}")
    print(f"📝 Total Transactions:   {revenue_count + expense_count}")
    
    print("\n" + "="*60)
    print("✅ Financial data seeding complete!")
    print("="*60)


def main():
    """Main seeding function"""
    print("\n" + "="*60)
    print("💰 COD CRM - Financial Data Seeding")
    print("="*60)
    
    # Table should already exist (created via migration or SQL)
    print("✅ Tables ready")
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Clear existing transactions
        existing = db.query(Transaction).count()
        if existing > 0:
            print(f"\n⚠️  Found {existing} existing transactions. Clearing...")
            db.query(Transaction).delete()
            db.commit()
            print("✅ Cleared existing transactions")
        
        # Seed data
        seed_revenue_transactions(db)
        seed_marketing_expenses(db)
        seed_operational_expenses(db)
        seed_additional_expenses(db)
        
        # Print summary
        print_summary(db)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
