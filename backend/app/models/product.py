from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Category(Base):
    """Product categories for organization"""
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    products = relationship("Product", back_populates="category")
    parent = relationship("Category", remote_side=[id], backref="subcategories")
    
    def __repr__(self):
        return f"<Category {self.name}>"


class Product(Base):
    """Product/Inventory model"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Info
    name = Column(String(255), nullable=False, index=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    barcode = Column(String(100), nullable=True, unique=True)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    
    # Category
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    # Pricing
    cost_price = Column(Float, nullable=False, default=0)  # What you pay
    selling_price = Column(Float, nullable=False)  # What customer pays
    compare_at_price = Column(Float, nullable=True)  # Original price (for discounts)
    
    # Stock Management
    stock_quantity = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=10)
    track_inventory = Column(Boolean, default=True)
    allow_backorder = Column(Boolean, default=False)
    
    # Product Details
    weight = Column(Float, nullable=True)  # in kg
    dimensions = Column(String(100), nullable=True)  # LxWxH
    
    # Dynamic Variants (JSON)
    # Example: {"colors": ["Black", "White", "Red"], "sizes": ["S", "M", "L", "XL"]}
    # For shoes: {"colors": ["Black", "White"], "sizes": ["40", "41", "42", "43", "44"]}
    # For simple products: null or {}
    variants = Column(JSON, nullable=True, default=None)
    
    # Images
    image_url = Column(String(500), nullable=True)
    gallery_images = Column(Text, nullable=True)  # JSON array of URLs
    
    # Status
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    
    # SEO & Marketing
    tags = Column(Text, nullable=True)  # JSON array
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    
    # Call Scripts for Agents
    call_script = Column(Text, nullable=True)  # Script for calling customers
    confirmation_script = Column(Text, nullable=True)  # Script for order confirmation
    
    # Stats
    total_sold = Column(Integer, default=0)
    total_revenue = Column(Float, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship("Category", back_populates="products")
    stock_movements = relationship("StockMovement", back_populates="product")
    
    def __repr__(self):
        return f"<Product {self.sku}: {self.name}>"
    
    @property
    def profit_margin(self):
        """Calculate profit margin percentage"""
        if self.selling_price > 0:
            return round(((self.selling_price - self.cost_price) / self.selling_price) * 100, 2)
        return 0
    
    @property
    def profit_per_unit(self):
        """Calculate profit per unit"""
        return self.selling_price - self.cost_price
    
    @property
    def is_low_stock(self):
        """Check if stock is below threshold"""
        return self.stock_quantity <= self.low_stock_threshold
    
    @property
    def is_out_of_stock(self):
        """Check if out of stock"""
        return self.stock_quantity <= 0
    
    @property
    def stock_value(self):
        """Total value of current stock at cost"""
        return self.stock_quantity * self.cost_price
    
    @property
    def has_variants(self):
        """Check if product has variants"""
        return bool(self.variants and len(self.variants) > 0)
    
    @property
    def variant_types(self):
        """Get list of variant types (e.g., ['colors', 'sizes'])"""
        if not self.variants:
            return []
        return list(self.variants.keys())


class StockMovement(Base):
    """Track all stock changes"""
    __tablename__ = "stock_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Movement details
    movement_type = Column(String(50), nullable=False)  # IN, OUT, ADJUSTMENT, RETURN
    quantity = Column(Integer, nullable=False)  # Positive for IN, negative for OUT
    previous_stock = Column(Integer, nullable=False)
    new_stock = Column(Integer, nullable=False)
    
    # Reference
    reference_type = Column(String(50), nullable=True)  # ORDER, MANUAL, RETURN, DAMAGE
    reference_id = Column(Integer, nullable=True)  # order_id if from order
    
    # Details
    notes = Column(Text, nullable=True)
    cost_per_unit = Column(Float, nullable=True)
    
    # User tracking
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="stock_movements")
