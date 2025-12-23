#!/usr/bin/env python3
"""
Create Products Tables

This script creates the products, categories, and stock_movements tables.
"""

import sys
sys.path.append('.')

from app.core.database import engine, Base
from app.models.product import Product, Category, StockMovement

print("Creating products tables...")
print("  - categories")
print("  - products")
print("  - stock_movements")

Base.metadata.create_all(bind=engine)

print("\n✅ Products tables created successfully!")
