from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============== PRODUCT VARIANT SCHEMAS ==============

class ProductVariantBase(BaseModel):
    """Base variant schema"""
    variant_name: str
    sku: str
    color: Optional[str] = None
    size: Optional[str] = None
    capacity: Optional[str] = None
    image_url: Optional[str] = None
    price_override: Optional[float] = None
    cost_override: Optional[float] = None
    stock_quantity: int = 0
    is_active: bool = True


class ProductVariantCreate(ProductVariantBase):
    """Schema for creating variant"""
    pass


class ProductVariantResponse(ProductVariantBase):
    """Schema for variant response"""
    id: int
    product_id: int
    is_low_stock: bool = False
    is_in_stock: bool = True
    
    class Config:
        from_attributes = True


# ============== CATEGORY SCHEMAS ==============
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    parent_id: Optional[int]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Product Schemas
class ProductCreate(BaseModel):
    name: str
    sku: str
    barcode: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: Optional[int] = None
    cost_price: float = 0
    selling_price: float
    compare_at_price: Optional[float] = None
    stock_quantity: int = 0
    low_stock_threshold: int = 10
    track_inventory: bool = True
    allow_backorder: bool = False
    weight: Optional[float] = None
    dimensions: Optional[str] = None
    variants: Optional[Dict[str, List[str]]] = None  # {"colors": [...], "sizes": [...]}
    image_url: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    tags: Optional[str] = None
    call_script: Optional[str] = None
    confirmation_script: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: Optional[int] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    compare_at_price: Optional[float] = None
    low_stock_threshold: Optional[int] = None
    track_inventory: Optional[bool] = None
    allow_backorder: Optional[bool] = None
    weight: Optional[float] = None
    dimensions: Optional[str] = None
    variants: Optional[Dict[str, List[str]]] = None  # {"colors": [...], "sizes": [...]}
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    tags: Optional[str] = None
    call_script: Optional[str] = None
    confirmation_script: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    barcode: Optional[str]
    description: Optional[str]
    short_description: Optional[str]
    category_id: Optional[int]
    category_name: Optional[str] = None
    cost_price: float
    selling_price: float
    compare_at_price: Optional[float]
    stock_quantity: int
    variant_count: int = 0  # Number of active variants
    low_stock_threshold: int
    track_inventory: bool
    allow_backorder: bool
    weight: Optional[float]
    dimensions: Optional[str]
    image_url: Optional[str]
    is_active: bool
    is_featured: bool
    tags: Optional[str]
    variants: Optional[Dict[str, List[str]]] = None  # {"colors": [...], "sizes": [...]}
    has_variants: bool = False
    call_script: Optional[str] = None
    confirmation_script: Optional[str] = None
    total_sold: int
    total_revenue: float
    profit_margin: float
    profit_per_unit: float
    is_low_stock: bool
    is_out_of_stock: bool
    stock_value: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Stock Movement Schemas
class StockAdjustment(BaseModel):
    quantity: int  # Positive to add, negative to remove
    reason: str
    notes: Optional[str] = None


class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    movement_type: str
    quantity: int
    previous_stock: int
    new_stock: int
    reference_type: Optional[str]
    reference_id: Optional[int]
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Inventory Stats
class InventoryStats(BaseModel):
    total_products: int
    active_products: int
    out_of_stock: int
    low_stock: int
    total_stock_value: float
    total_retail_value: float
    potential_profit: float
    categories_count: int
