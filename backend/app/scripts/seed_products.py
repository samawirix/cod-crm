"""
Seed products with realistic variants
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.product import Product
from app.models.product_variant import ProductVariant


def seed_products_with_variants():
    """Seed products with realistic Moroccan COD variants"""
    db = SessionLocal()
    
    try:
        print("🌱 Seeding Products with Variants...")
        
        # Clear existing variants
        db.query(ProductVariant).delete()
        db.commit()
        print("✅ Cleared existing variants")
        
        # Get existing products or create new ones
        products = db.query(Product).limit(5).all()
        
        if len(products) < 3:
            print("⚠️ Creating sample products...")
            
            # Product 1: Smart Watch Pro (Color variants)
            watch = Product(
                name="Smart Watch Pro",
                sku="WATCH-PRO",
                selling_price=199.0,
                cost_price=120.0,
                stock_quantity=0,
                image_url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
            )
            db.add(watch)
            db.commit()
            
            # Product 2: Running Shoes (Size variants)
            shoes = Product(
                name="Running Shoes - Men",
                sku="SHOES-RUN-M",
                selling_price=350.0,
                cost_price=200.0,
                stock_quantity=0,
                image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"
            )
            db.add(shoes)
            db.commit()
            
            # Product 3: Anti-Aging Face Cream (Capacity variants)
            cream = Product(
                name="Anti-Aging Face Cream",
                sku="CREAM-ANTI-AGE",
                selling_price=120.0,
                cost_price=60.0,
                stock_quantity=0,
                image_url="https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400"
            )
            db.add(cream)
            db.commit()
            
            products = [watch, shoes, cream]
        
        # Add variants to first product (Color variants)
        if len(products) >= 1:
            product = products[0]
            print(f"📦 Adding color variants to: {product.name}")
            
            colors = [
                ("Black", "Black", 50),
                ("Silver", "Silver", 30),
                ("Gold", "Gold", 15),
            ]
            
            for color_name, color, stock in colors:
                variant = ProductVariant(
                    product_id=product.id,
                    sku=f"{product.sku}-{color_name.upper()}",
                    variant_name=color_name,
                    color=color,
                    image_url=product.image_url,
                    stock_quantity=stock,
                    price_override=229.0 if color_name == "Gold" else None
                )
                db.add(variant)
            db.commit()
        
        # Add variants to second product (Size variants)
        if len(products) >= 2:
            product = products[1]
            print(f"📦 Adding size variants to: {product.name}")
            
            sizes = [39, 40, 41, 42, 43, 44]
            
            for size in sizes:
                variant = ProductVariant(
                    product_id=product.id,
                    sku=f"{product.sku}-{size}",
                    variant_name=f"Size {size}",
                    size=str(size),
                    image_url=product.image_url,
                    stock_quantity=25
                )
                db.add(variant)
            db.commit()
        
        # Add variants to third product (Capacity variants)
        if len(products) >= 3:
            product = products[2]
            print(f"📦 Adding capacity variants to: {product.name}")
            
            capacities = [
                ("50ml", 100, None),
                ("100ml", 60, 199.0),
            ]
            
            for capacity, stock, price in capacities:
                variant = ProductVariant(
                    product_id=product.id,
                    sku=f"{product.sku}-{capacity.upper()}",
                    variant_name=capacity,
                    capacity=capacity,
                    image_url=product.image_url,
                    stock_quantity=stock,
                    price_override=price
                )
                db.add(variant)
            db.commit()
        
        # Print summary
        total_variants = db.query(ProductVariant).count()
        print(f"\n✅ Products seeded successfully!")
        print(f"   - {len(products)} products")
        print(f"   - {total_variants} variants")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_products_with_variants()
