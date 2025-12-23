#!/usr/bin/env python3
"""
Seed Products

This script creates sample categories and products for testing.
"""

import sys
sys.path.append('.')

from app.core.database import SessionLocal
from app.models.product import Product, Category

db = SessionLocal()

# Create categories
categories_data = [
    {"name": "Electronics", "description": "Electronic devices and accessories"},
    {"name": "Clothing", "description": "Fashion and apparel"},
    {"name": "Beauty", "description": "Beauty and skincare products"},
    {"name": "Home & Garden", "description": "Home decor and garden items"},
    {"name": "Sports", "description": "Sports equipment and accessories"},
]

print("Creating categories...")
categories = {}
for cat_data in categories_data:
    existing = db.query(Category).filter(Category.name == cat_data["name"]).first()
    if not existing:
        category = Category(**cat_data)
        db.add(category)
        db.commit()
        db.refresh(category)
        categories[cat_data["name"]] = category
        print(f"  ✅ Created: {cat_data['name']}")
    else:
        categories[cat_data["name"]] = existing
        print(f"  ⏭️  Exists: {cat_data['name']}")

# Create sample products
products_data = [
    {
        "name": "Wireless Bluetooth Earbuds",
        "sku": "ELEC-001",
        "description": "High-quality wireless earbuds with noise cancellation",
        "category_id": categories["Electronics"].id,
        "cost_price": 150,
        "selling_price": 299,
        "stock_quantity": 50,
        "low_stock_threshold": 10,
        "is_featured": True
    },
    {
        "name": "Smart Watch Pro",
        "sku": "ELEC-002",
        "description": "Advanced smartwatch with health monitoring",
        "category_id": categories["Electronics"].id,
        "cost_price": 400,
        "selling_price": 799,
        "stock_quantity": 30,
        "low_stock_threshold": 5,
        "is_featured": True
    },
    {
        "name": "Men's Casual T-Shirt",
        "sku": "CLO-001",
        "description": "Comfortable cotton t-shirt",
        "category_id": categories["Clothing"].id,
        "cost_price": 50,
        "selling_price": 129,
        "stock_quantity": 100,
        "low_stock_threshold": 20
    },
    {
        "name": "Women's Summer Dress",
        "sku": "CLO-002",
        "description": "Elegant summer dress",
        "category_id": categories["Clothing"].id,
        "cost_price": 120,
        "selling_price": 299,
        "stock_quantity": 45,
        "low_stock_threshold": 10
    },
    {
        "name": "Anti-Aging Face Cream",
        "sku": "BEAUTY-001",
        "description": "Premium anti-aging cream with vitamin C",
        "category_id": categories["Beauty"].id,
        "cost_price": 80,
        "selling_price": 199,
        "stock_quantity": 75,
        "low_stock_threshold": 15
    },
    {
        "name": "Organic Shampoo",
        "sku": "BEAUTY-002",
        "description": "Natural organic shampoo for all hair types",
        "category_id": categories["Beauty"].id,
        "cost_price": 40,
        "selling_price": 89,
        "stock_quantity": 120,
        "low_stock_threshold": 25
    },
    {
        "name": "Yoga Mat Premium",
        "sku": "SPORT-001",
        "description": "Non-slip premium yoga mat",
        "category_id": categories["Sports"].id,
        "cost_price": 60,
        "selling_price": 149,
        "stock_quantity": 40,
        "low_stock_threshold": 8
    },
    {
        "name": "Running Shoes - Men",
        "sku": "SPORT-002",
        "description": "Lightweight running shoes",
        "category_id": categories["Sports"].id,
        "cost_price": 200,
        "selling_price": 449,
        "stock_quantity": 25,
        "low_stock_threshold": 5,
        "is_featured": True
    },
    {
        "name": "LED Desk Lamp",
        "sku": "HOME-001",
        "description": "Adjustable LED desk lamp with USB charging",
        "category_id": categories["Home & Garden"].id,
        "cost_price": 70,
        "selling_price": 159,
        "stock_quantity": 60,
        "low_stock_threshold": 12
    },
    {
        "name": "Indoor Plant Pot Set",
        "sku": "HOME-002",
        "description": "Set of 3 ceramic plant pots",
        "category_id": categories["Home & Garden"].id,
        "cost_price": 45,
        "selling_price": 99,
        "stock_quantity": 80,
        "low_stock_threshold": 15
    },
]

print("\nCreating products...")
for prod_data in products_data:
    existing = db.query(Product).filter(Product.sku == prod_data["sku"]).first()
    if not existing:
        product = Product(**prod_data)
        db.add(product)
        db.commit()
        print(f"  ✅ Created: {prod_data['name']} ({prod_data['sku']})")
    else:
        print(f"  ⏭️  Exists: {prod_data['name']} ({prod_data['sku']})")

db.close()
print("\n✅ Seed complete!")
