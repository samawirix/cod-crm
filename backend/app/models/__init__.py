"""
Models Package

This module exports all database models for the CRM system.
"""

from app.models.base import Base
from app.models.user import User
from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.lead_note import LeadNote, NoteType
from app.models.call_note import CallNote
from app.models.order import Order, OrderHistory
from app.models.order_item import OrderItem
from app.models.product import Product, Category, StockMovement
from app.models.blacklist import Blacklist, BlacklistReason
from app.models.courier import Courier
from app.models.shipment import Shipment, ShipmentStatus
from app.models.shipment_tracking import ShipmentTracking
from app.models.bordereau import Bordereau, BordereauStatus
from app.models.transaction import Transaction
from app.models.product_variant import ProductVariant

__all__ = [
    'Base',
    'User',
    'Lead',
    'LeadSource',
    'LeadStatus',
    'LeadNote',
    'NoteType',
    'CallNote',
    'Order',
    'OrderHistory',
    'OrderItem',
    'Product',
    'Category',
    'StockMovement',
    'Blacklist',
    'BlacklistReason',
    'Courier',
    'Shipment',
    'ShipmentStatus',
    'ShipmentTracking',
    'Bordereau',
    'BordereauStatus',
    'Transaction',
    'ProductVariant',
]
