from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base

class OrderStatus(str, enum.Enum):
    """Order status enum"""
    PENDING = "PENDING"  # Just created, not confirmed
    CONFIRMED = "CONFIRMED"  # Customer confirmed order
    CANCELLED = "CANCELLED"  # Customer cancelled
    PROCESSING = "PROCESSING"  # Being prepared
    SHIPPED = "SHIPPED"  # Sent to delivery
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"  # With delivery partner
    DELIVERED = "DELIVERED"  # Successfully delivered
    FAILED = "FAILED"  # Delivery failed
    RETURNED = "RETURNED"  # Customer returned
    REFUNDED = "REFUNDED"  # Money refunded

class PaymentStatus(str, enum.Enum):
    """Payment status enum"""
    PENDING = "PENDING"  # Not paid yet
    PAID = "PAID"  # Cash collected
    FAILED = "FAILED"  # Payment failed
    REFUNDED = "REFUNDED"  # Money returned

class CourierCompany(str, enum.Enum):
    """Courier company enum for Morocco"""
    AMANA = "AMANA"
    YALIDINE = "YALIDINE"
    CATHEDIS = "CATHEDIS"
    CTM = "CTM"
    CHRONO_DIALI = "CHRONO_DIALI"
    ARAMEX = "ARAMEX"
    OTHER = "OTHER"


# ═══════════════════════════════════════════════════════════════
# NEW ENUMS FOR LOGISTICS & COMMERCIAL DATA
# ═══════════════════════════════════════════════════════════════

class UTMSource(str, enum.Enum):
    """Traffic source tracking"""
    FACEBOOK = "facebook"
    TIKTOK = "tiktok"
    GOOGLE = "google"
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"
    SNAPCHAT = "snapchat"
    WHATSAPP = "whatsapp"
    ORGANIC = "organic"
    REFERRAL = "referral"
    OTHER = "other"


class SalesAction(str, enum.Enum):
    """Type of sales action"""
    NORMAL = "normal"
    UPSELL = "upsell"
    CROSS_SELL = "cross_sell"
    REPLACEMENT = "replacement"
    EXCHANGE = "exchange"


class ShippingCompany(str, enum.Enum):
    """Shipping company options for Morocco"""
    AMANA = "amana"
    COLIS_EXPRESS = "colis_express"
    TAWSSIL = "tawssil"
    HORA = "hora"
    YALITINE = "yalitine"
    JAXI = "jaxi"
    CHRONO_DIALI = "chrono_diali"
    PRIVATE = "private"
    OTHER = "other"

class Order(Base):
    """Order model for COD e-commerce"""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True)  # ORD-001, ORD-002
    
    # Customer info (from lead)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    customer_name = Column(String)
    customer_phone = Column(String)
    customer_email = Column(String, nullable=True)
    
    # Delivery address
    delivery_address = Column(Text)
    city = Column(String)
    postal_code = Column(String, nullable=True)
    
    # Order details
    product_name = Column(String)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float)
    subtotal = Column(Float)
    delivery_charges = Column(Float, default=0.0)
    total_amount = Column(Float)
    
    # Order status
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # COD specific fields
    is_confirmed = Column(Boolean, default=False)  # Did customer confirm?
    confirmed_by = Column(String, nullable=True)  # Agent who confirmed
    confirmed_at = Column(DateTime, nullable=True)
    
    # Courier tracking
    courier = Column(String(50), default=CourierCompany.AMANA.value)  # Courier company
    courier_tracking_url = Column(String(500), nullable=True)  # Tracking page URL
    
    # Delivery tracking
    tracking_number = Column(String, nullable=True)
    delivery_partner = Column(String, nullable=True)  # Name of delivery company
    delivery_attempts = Column(Integer, default=0)
    last_delivery_attempt = Column(DateTime, nullable=True)
    
    # Delivery status
    shipped_at = Column(DateTime, nullable=True)
    out_for_delivery_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    
    # Failed delivery
    delivery_failed = Column(Boolean, default=False)
    failure_reason = Column(Text, nullable=True)
    
    # Payment tracking
    payment_collected = Column(Boolean, default=False)
    payment_collected_at = Column(DateTime, nullable=True)
    cash_collected = Column(Float, nullable=True)
    
    # Return/exchange
    is_returned = Column(Boolean, default=False)
    return_reason = Column(Text, nullable=True)
    returned_at = Column(DateTime, nullable=True)
    
    # ═══════════════════════════════════════════════════════════
    # NEW: LOGISTICS & COMMERCIAL DATA FIELDS
    # ═══════════════════════════════════════════════════════════
    
    # UTM / Traffic Source Tracking
    utm_source = Column(String(50), nullable=True)  # facebook, tiktok, google, etc.
    utm_medium = Column(String(50), nullable=True)  # cpc, social, organic
    utm_campaign = Column(String(100), nullable=True)  # campaign name
    
    # Sales Action Type
    sales_action = Column(String(20), default="normal")  # normal, upsell, cross_sell, replacement, exchange
    
    # Shipping Company (additional tracking)
    shipping_company = Column(String(50), nullable=True)  # normalized shipping company name
    shipping_company_id = Column(Integer, ForeignKey('couriers.id'), nullable=True)
    
    # Exchange/Return Tracking
    is_exchange = Column(Boolean, default=False)
    original_order_id = Column(Integer, ForeignKey('orders.id'), nullable=True)
    original_order_ref = Column(String(50), nullable=True)  # Original order number for exchange
    exchange_reason = Column(String(200), nullable=True)
    
    # Additional Logistics
    estimated_delivery_date = Column(DateTime, nullable=True)
    actual_delivery_date = Column(DateTime, nullable=True)

    # Notes and comments
    notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lead = relationship("Lead", back_populates="orders")
    order_history = relationship("OrderHistory", back_populates="order", cascade="all, delete-orphan")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    shipment = relationship("Shipment", back_populates="order", uselist=False)

class OrderHistory(Base):
    """Track all status changes and actions on orders"""
    __tablename__ = "order_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    
    action = Column(String)  # "Status changed", "Note added", "Delivery attempt"
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    performed_by = Column(String)  # User who performed action
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    order = relationship("Order", back_populates="order_history")

