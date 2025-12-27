from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.services.product_service import ProductService
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    StockAdjustment, StockMovementResponse, InventoryStats,
    ProductVariantCreate, ProductVariantResponse,
    CrossSellProductResponse, QuantityDiscount, PriceCalculationResponse
)

router = APIRouter()


# Simple auth helper - matches leads.py pattern
def get_current_user(db: Session = Depends(get_db)):
    """Get current user - simplified version"""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No user found")
    return user


# ============ CATEGORY ENDPOINTS ============

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all categories"""
    service = ProductService(db)
    return service.get_categories(include_inactive)


@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new category"""
    service = ProductService(db)
    return service.create_category(
        name=category_data.name,
        description=category_data.description,
        parent_id=category_data.parent_id
    )


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a category"""
    service = ProductService(db)
    try:
        return service.update_category(category_id, **category_data.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a category"""
    service = ProductService(db)
    try:
        service.delete_category(category_id)
        return {"message": "Category deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============ PRODUCT ENDPOINTS ============

@router.get("/", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    low_stock_only: bool = False,
    out_of_stock_only: bool = False,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get paginated list of products with filters"""
    service = ProductService(db)
    return service.get_products(
        page=page,
        page_size=page_size,
        search=search,
        category_id=category_id,
        is_active=is_active,
        is_featured=is_featured,
        low_stock_only=low_stock_only,
        out_of_stock_only=out_of_stock_only,
        sort_by=sort_by,
        sort_order=sort_order
    )


@router.get("/stats", response_model=InventoryStats)
async def get_inventory_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get inventory statistics"""
    service = ProductService(db)
    return service.get_inventory_stats()


@router.get("/low-stock", response_model=ProductListResponse)
async def get_low_stock_products(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get products with low stock"""
    service = ProductService(db)
    products = service.get_low_stock_products(limit)
    return {
        "products": products,
        "total": len(products),
        "page": 1,
        "page_size": limit,
        "total_pages": 1
    }


@router.get("/top-selling", response_model=ProductListResponse)
async def get_top_selling_products(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get top selling products"""
    service = ProductService(db)
    products = service.get_top_selling_products(limit)
    return {
        "products": products,
        "total": len(products),
        "page": 1,
        "page_size": limit,
        "total_pages": 1
    }


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get product by ID"""
    service = ProductService(db)
    product = service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new product"""
    service = ProductService(db)
    try:
        return service.create_product(product_data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a product"""
    service = ProductService(db)
    try:
        return service.update_product(product_id, product_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a product (soft delete)"""
    service = ProductService(db)
    try:
        service.delete_product(product_id)
        return {"message": "Product deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============ STOCK ENDPOINTS ============

@router.post("/{product_id}/adjust-stock", response_model=ProductResponse)
async def adjust_stock(
    product_id: int,
    adjustment: StockAdjustment,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Adjust product stock"""
    service = ProductService(db)
    try:
        return service.adjust_stock(product_id, adjustment, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{product_id}/stock-movements", response_model=List[StockMovementResponse])
async def get_stock_movements(
    product_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get stock movement history"""
    service = ProductService(db)
    return service.get_stock_movements(product_id, limit)


# ============ PRODUCT VARIANT ENDPOINTS ============

@router.get("/{product_id}/variants", response_model=List[ProductVariantResponse])
async def get_product_variants(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all variants for a product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    variants = db.query(ProductVariant).filter(
        ProductVariant.product_id == product_id,
        ProductVariant.is_active == True
    ).all()
    
    return variants


@router.post("/{product_id}/variants", response_model=ProductVariantResponse, status_code=201)
async def create_product_variant(
    product_id: int,
    variant: ProductVariantCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new variant for a product"""
    # Check if product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if SKU is unique
    existing = db.query(ProductVariant).filter(ProductVariant.sku == variant.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    # Create variant
    new_variant = ProductVariant(
        product_id=product_id,
        sku=variant.sku,
        variant_name=variant.variant_name,
        color=variant.color,
        size=variant.size,
        capacity=variant.capacity,
        image_url=variant.image_url,
        price_override=variant.price_override,
        cost_override=variant.cost_override,
        stock_quantity=variant.stock_quantity,
        is_active=variant.is_active
    )
    
    db.add(new_variant)
    db.commit()
    db.refresh(new_variant)
    
    return new_variant


@router.put("/variants/{variant_id}", response_model=ProductVariantResponse)
async def update_product_variant(
    variant_id: int,
    variant_update: ProductVariantCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a variant"""
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    # Update fields
    variant.variant_name = variant_update.variant_name
    variant.sku = variant_update.sku
    variant.color = variant_update.color
    variant.size = variant_update.size
    variant.capacity = variant_update.capacity
    variant.image_url = variant_update.image_url
    variant.price_override = variant_update.price_override
    variant.cost_override = variant_update.cost_override
    variant.stock_quantity = variant_update.stock_quantity
    variant.is_active = variant_update.is_active
    
    db.commit()
    db.refresh(variant)
    
    return variant


@router.delete("/variants/{variant_id}")
async def delete_product_variant(
    variant_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a variant (soft delete)"""
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    variant.is_active = False
    db.commit()
    
    return {"message": "Variant deleted successfully"}


# ═══════════════════════════════════════════════════════════════
# CROSS-SELL & QUANTITY DISCOUNT ENDPOINTS (Phase 2)
# ═══════════════════════════════════════════════════════════════

@router.get("/{product_id}/cross-sells", response_model=List[CrossSellProductResponse])
async def get_cross_sell_products(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get cross-sell product suggestions for a specific product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product.cross_sell_ids:
        return []
    
    cross_sell_products = db.query(Product).filter(
        Product.id.in_(product.cross_sell_ids),
        Product.is_active == True
    ).all()
    
    return cross_sell_products


@router.put("/{product_id}/cross-sells", response_model=ProductResponse)
async def update_cross_sell_products(
    product_id: int,
    cross_sell_ids: List[int],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update cross-sell product IDs for a specific product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Validate that all cross-sell IDs exist
    if cross_sell_ids:
        existing_ids = db.query(Product.id).filter(Product.id.in_(cross_sell_ids)).all()
        existing_ids = [id[0] for id in existing_ids]
        invalid_ids = set(cross_sell_ids) - set(existing_ids)
        if invalid_ids:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid product IDs: {invalid_ids}"
            )
        # Remove self-reference if present
        cross_sell_ids = [id for id in cross_sell_ids if id != product_id]
    
    product.cross_sell_ids = cross_sell_ids
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}/quantity-discounts", response_model=ProductResponse)
async def update_quantity_discounts(
    product_id: int,
    discounts: List[QuantityDiscount],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update quantity discount tiers for a specific product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Sort discounts by min_qty ascending
    sorted_discounts = sorted(
        [d.model_dump() for d in discounts], 
        key=lambda x: x["min_qty"]
    )
    
    product.quantity_discounts = sorted_discounts
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}/calculate-price", response_model=PriceCalculationResponse)
async def calculate_discounted_price(
    product_id: int,
    quantity: int = Query(1, ge=1),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Calculate price with quantity discount applied"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    base_price = product.selling_price
    discount_percent = 0.0
    
    # Find applicable discount tier
    if product.quantity_discounts:
        for tier in sorted(product.quantity_discounts, key=lambda x: x["min_qty"], reverse=True):
            if quantity >= tier["min_qty"]:
                discount_percent = tier["discount_percent"]
                break
    
    subtotal = base_price * quantity
    discount_amount = subtotal * (discount_percent / 100)
    final_price = subtotal - discount_amount
    
    return {
        "product_id": product_id,
        "quantity": quantity,
        "unit_price": base_price,
        "subtotal": round(subtotal, 2),
        "discount_percent": discount_percent,
        "discount_amount": round(discount_amount, 2),
        "final_price": round(final_price, 2)
    }
