"""
Seed products with realistic variants - with proper image URLs for visual product selector
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
# Import through models package to ensure relationships are properly initialized
from app.models import Product, ProductVariant


def seed_products_with_variants():
    """Seed products with realistic Moroccan COD variants and images"""
    db = SessionLocal()
    
    try:
        print("🌱 Seeding Products with Variants...")
        
        # Clear existing variants first (foreign key constraint)
        db.query(ProductVariant).delete()
        db.commit()
        print("✅ Cleared existing variants")
        
        # Product 1: Smart Watch Pro (Color variants)
        watch = db.query(Product).filter(Product.sku == "WATCH-PRO").first()
        if not watch:
            watch = Product(
                name="Smart Watch Pro",
                sku="WATCH-PRO",
                selling_price=799.0,
                cost_price=400.0,
                stock_quantity=0,
                image_url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
            )
            db.add(watch)
            db.commit()
        else:
            watch.image_url = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
            db.commit()
        
        # Watch variants
        watch_variants = [
            ProductVariant(
                product_id=watch.id,
                sku="WATCH-PRO-BLACK",
                variant_name="Black",
                color="Black",
                image_url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
                stock_quantity=50
            ),
            ProductVariant(
                product_id=watch.id,
                sku="WATCH-PRO-SILVER",
                variant_name="Silver",
                color="Silver",
                image_url="https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=200",
                stock_quantity=30
            ),
            ProductVariant(
                product_id=watch.id,
                sku="WATCH-PRO-GOLD",
                variant_name="Gold",
                color="Gold",
                price_override=899.0,  # Gold is more expensive
                image_url="https://images.unsplash.com/photo-1622434641406-a158123450f9?w=200",
                stock_quantity=15
            ),
        ]
        db.add_all(watch_variants)
        print(f"📦 Added 3 color variants for: {watch.name}")
        
        # Product 2: Running Shoes (Size variants)
        shoes = db.query(Product).filter(Product.sku == "SHOES-RUN-M").first()
        if not shoes:
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
        else:
            shoes.image_url = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"
            db.commit()
        
        # Shoes variants (sizes)
        for size in [39, 40, 41, 42, 43, 44]:
            variant = ProductVariant(
                product_id=shoes.id,
                sku=f"SHOES-RUN-M-{size}",
                variant_name=f"Size {size}",
                size=str(size),
                image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200",
                stock_quantity=25
            )
            db.add(variant)
        print(f"📦 Added 6 size variants for: {shoes.name}")
        
        # Product 3: Anti-Aging Face Cream (Capacity variants)
        cream = db.query(Product).filter(Product.sku == "CREAM-ANTI-AGE").first()
        if not cream:
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
        else:
            cream.image_url = "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400"
            db.commit()
        
        # Cream variants (capacity)
        cream_variants = [
            ProductVariant(
                product_id=cream.id,
                sku="CREAM-ANTI-AGE-50ML",
                variant_name="50ml",
                capacity="50ml",
                image_url="https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200",
                stock_quantity=100
            ),
            ProductVariant(
                product_id=cream.id,
                sku="CREAM-ANTI-AGE-100ML",
                variant_name="100ml",
                capacity="100ml",
                price_override=199.0,
                image_url="https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200",
                stock_quantity=60
            ),
        ]
        db.add_all(cream_variants)
        print(f"📦 Added 2 capacity variants for: {cream.name}")
        
        # Product 4: Wireless Bluetooth Earbuds (No variants - single product)
        earbuds = db.query(Product).filter(Product.sku == "EARBUDS-BT-001").first()
        if not earbuds:
            earbuds = Product(
                name="Wireless Bluetooth Earbuds",
                sku="EARBUDS-BT-001",
                selling_price=180.0,
                cost_price=90.0,
                stock_quantity=75,
                image_url="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400"
            )
            db.add(earbuds)
        else:
            earbuds.image_url = "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400"
        
        db.commit()
        
        # Print summary
        total_products = db.query(Product).count()
        total_variants = db.query(ProductVariant).count()
        print(f"\n✅ Products seeded successfully!")
        print(f"   - {total_products} products")
        print(f"   - {total_variants} variants")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_products_with_variants()
