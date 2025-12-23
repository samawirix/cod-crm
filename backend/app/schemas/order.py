from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class OrderCreate(BaseModel):
    """Schema for creating a new order"""
    lead_id: int
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    delivery_address: str
    city: str
    postal_code: Optional[str] = None
    product_name: str
    quantity: int = 1
    unit_price: float
    delivery_charges: float = 0.0
    courier: Optional[str] = "AMANA"
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    """Schema for updating order"""
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    delivery_address: Optional[str] = None
    city: Optional[str] = None
    product_name: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    delivery_charges: Optional[float] = None
    status: Optional[str] = None
    courier: Optional[str] = None
    courier_tracking_url: Optional[str] = None
    notes: Optional[str] = None

class OrderConfirm(BaseModel):
    """Schema for confirming an order"""
    confirmed_by: str
    notes: Optional[str] = None

class OrderShipping(BaseModel):
    """Schema for shipping info"""
    tracking_number: str
    delivery_partner: str
    notes: Optional[str] = None

class OrderDelivery(BaseModel):
    """Schema for delivery update"""
    success: bool
    failure_reason: Optional[str] = None
    cash_collected: Optional[float] = None
    notes: Optional[str] = None

class OrderReturn(BaseModel):
    """Schema for return/exchange"""
    return_reason: str
    notes: Optional[str] = None

class OrderHistoryResponse(BaseModel):
    """Order history entry"""
    id: int
    action: str
    old_status: Optional[str]
    new_status: Optional[str]
    notes: Optional[str]
    performed_by: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    """Order response"""
    id: int
    order_number: str
    lead_id: int
    customer_name: str
    customer_phone: str
    customer_email: Optional[str]
    delivery_address: str
    city: str
    postal_code: Optional[str]
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float
    delivery_charges: float
    total_amount: float
    status: str
    payment_status: str
    is_confirmed: bool
    confirmed_by: Optional[str]
    confirmed_at: Optional[datetime]
    courier: Optional[str] = None
    courier_tracking_url: Optional[str] = None
    tracking_number: Optional[str]
    delivery_partner: Optional[str]
    delivery_attempts: int
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]
    delivery_failed: bool
    failure_reason: Optional[str]
    payment_collected: bool
    cash_collected: Optional[float]
    is_returned: bool
    return_reason: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrderListResponse(BaseModel):
    """List of orders with pagination"""
    orders: List[OrderResponse]
    total: int
    page: int
    per_page: int


# ============ ORDER ITEM SCHEMAS ============

class OrderItemCreate(BaseModel):
    """Schema for creating an order item"""
    product_id: int
    quantity: int = 1
    discount: float = 0


class OrderItemResponse(BaseModel):
    """Schema for order item response"""
    id: int
    product_id: int
    product_name: str
    product_sku: str
    unit_price: float
    cost_price: float
    quantity: int
    subtotal: float
    discount: float
    total: float

    class Config:
        from_attributes = True


class OrderCreateWithItems(BaseModel):
    """Schema for creating order with multiple products"""
    lead_id: int
    items: List[OrderItemCreate]  # Multiple products
    shipping_cost: float = 0
    discount: float = 0  # Order-level discount
    shipping_address: str
    shipping_city: str
    shipping_region: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    order_notes: Optional[str] = None


class OrderDetailWithItems(OrderResponse):
    """Order detail with items included"""
    items: List[OrderItemResponse] = []
    total_items: int = 0
    total_quantity: int = 0
    items_subtotal: float = 0
    total_cost: float = 0
    total_profit: float = 0
