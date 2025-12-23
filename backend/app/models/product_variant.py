"""
Product Variant Model - For color/size/capacity variations with individual inventory
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class ProductVariant(Base):
    """
    Product variations (e.g., Smart Watch - Black, Silver, Gold)
    Each variant has its own SKU, price, cost, stock, and image
    """
    __tablename__ = "product_variants"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Link to parent product
    product_id = Column(Integer, nullable=False)  # Reference to products.id
    
    # Variant identification
    sku = Column(String(100), unique=True, nullable=False, index=True)  # e.g., "WATCH-PRO-BLACK"
    variant_name = Column(String(200), nullable=False)  # e.g., "Black"
    
    # Optional attributes
    color = Column(String(50), nullable=True)  # e.g., "Black", "#000000"
    size = Column(String(50), nullable=True)   # e.g., "M", "XL", "42"
    capacity = Column(String(50), nullable=True)  # e.g., "50ml", "100ml"
    
    # Visual
    image_url = Column(String(500), nullable=True)  # Variant-specific image
    
    # Pricing (can override parent product)
    price_override = Column(Float, nullable=True)  # If different from base price
    cost_override = Column(Float, nullable=True)   # If different COGS
    
    # Inventory
    stock_quantity = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=10)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<ProductVariant {self.sku}: {self.variant_name}>"
    
    @property
    def is_low_stock(self):
        """Check if stock is below threshold"""
        return self.stock_quantity <= self.low_stock_threshold
    
    @property
    def is_in_stock(self):
        """Check if variant is available"""
        return self.stock_quantity > 0 and self.is_active
