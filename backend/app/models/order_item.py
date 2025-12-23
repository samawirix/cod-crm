from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class OrderItem(Base):
    """Individual items within an order"""
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Product snapshot (copied at time of order)
    product_name = Column(String(255), nullable=False)
    product_sku = Column(String(100), nullable=False)
    
    # Pricing
    unit_price = Column(Float, nullable=False)  # Selling price at time of order
    cost_price = Column(Float, nullable=False)  # Cost price for profit calculation
    quantity = Column(Integer, nullable=False, default=1)
    subtotal = Column(Float, nullable=False)  # unit_price * quantity
    
    # Discount per item (optional)
    discount = Column(Float, default=0)
    total = Column(Float, nullable=False)  # subtotal - discount
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    
    def __repr__(self):
        return f"<OrderItem {self.product_sku} x{self.quantity}>"
