from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.models.order import Order, OrderHistory, OrderStatus, PaymentStatus
from app.models.order_item import OrderItem
from app.models.lead import Lead
from app.models.user import User
from app.schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderConfirm,
    OrderShipping,
    OrderDelivery,
    OrderReturn,
    OrderResponse,
    OrderListResponse,
    OrderHistoryResponse,
    OrderCreateWithItems,
    OrderItemResponse,
)

router = APIRouter()


# Simple auth helper - matches leads.py pattern
def get_current_user(db: Session = Depends(get_db)):
    """Get current user - simplified version"""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No user found")
    return user

def generate_order_number(db: Session) -> str:
    """Generate unique order number using max ID + random suffix"""
    from sqlalchemy import func
    import random
    import string
    
    # Get max order ID
    max_id = db.query(func.max(Order.id)).scalar() or 0
    new_number = max_id + 1
    
    # Add random suffix for extra uniqueness
    random_suffix = ''.join(random.choices(string.digits, k=3))
    return f"ORD-{new_number:05d}-{random_suffix}"

def add_order_history(
    db: Session,
    order_id: int,
    action: str,
    old_status: Optional[str],
    new_status: Optional[str],
    notes: Optional[str],
    performed_by: str
):
    """Add entry to order history"""
    history = OrderHistory(
        order_id=order_id,
        action=action,
        old_status=old_status,
        new_status=new_status,
        notes=notes,
        performed_by=performed_by
    )
    db.add(history)
    db.commit()

# ═══════════════════════════════════════════════════════════
# CALL CENTER ORDER CREATION (FLEXIBLE SCHEMA)
# ═══════════════════════════════════════════════════════════

class CallCenterOrderItem(BaseModel):
    product_id: int
    product_name: Optional[str] = None
    quantity: int = 1
    unit_price: float = 0
    total_price: Optional[float] = None
    selected_variants: Optional[dict] = None
    sale_type: Optional[str] = "normal"  # normal, cross-sell, upsell

class CallCenterOrderCreate(BaseModel):
    """Flexible schema for Call Center order creation"""
    lead_id: Optional[int] = None
    customer_name: Optional[str] = ""
    customer_phone: Optional[str] = ""
    city: Optional[str] = None
    zone: Optional[str] = None
    address: Optional[str] = None
    items: Optional[List[CallCenterOrderItem]] = []
    subtotal: Optional[float] = 0
    shipping_cost: Optional[float] = 0
    total_amount: Optional[float] = 0
    courier_code: Optional[str] = "AMANA"
    is_exchange: Optional[bool] = False
    is_upsell: Optional[bool] = False
    notes: Optional[str] = None
    source: Optional[str] = "CALL_CENTER"
    status: Optional[str] = "CONFIRMED"
    # Additional fields for simple frontend schema
    payment_method: Optional[str] = "cod"
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_zone: Optional[str] = None

@router.post("/call-center")
async def create_call_center_order(
    order_data: CallCenterOrderCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create order from Call Center with flexible item structure
    Supports both simple schema (lead_id + total) and complex schema (with items)
    """
    from app.models.product import Product
    
    # Get lead info if lead_id provided and customer info not provided
    lead = None
    customer_name = order_data.customer_name
    customer_phone = order_data.customer_phone
    city = order_data.city or order_data.shipping_city
    address = order_data.address or order_data.shipping_address
    
    if order_data.lead_id:
        lead = db.query(Lead).filter(Lead.id == order_data.lead_id).first()
        if lead:
            if not customer_name:
                customer_name = f"{lead.first_name or ''} {lead.last_name or ''}".strip() or f"Lead {lead.id}"
            if not customer_phone:
                customer_phone = lead.phone or ""
            if not city:
                city = lead.city or ""
            if not address:
                address = lead.address or ""
    
    print(f"📦 Call Center Order: {customer_name}, {len(order_data.items or [])} items")
    
    # Validate and calculate items (may be empty for simple orders)
    order_items_data = []
    calculated_subtotal = 0
    product_names = []
    total_quantity = 0
    
    for item in order_data.items:
        # Get product to verify price/name
        product = db.query(Product).filter(Product.id == item.product_id).first()
        
        if product:
            unit_price = item.unit_price if item.unit_price > 0 else (product.selling_price or 0)
            product_name = item.product_name or product.name
            product_sku = getattr(product, 'sku', None) or f"SKU-{item.product_id}"
            cost_price = getattr(product, 'cost_price', None) or (unit_price * 0.6)
        else:
            unit_price = item.unit_price or 0
            product_name = item.product_name or f"Product {item.product_id}"
            product_sku = f"SKU-{item.product_id}"
            cost_price = unit_price * 0.6
        
        item_total = unit_price * item.quantity
        calculated_subtotal += item_total
        total_quantity += item.quantity
        product_names.append(product_name)
        
        order_items_data.append({
            "product_id": item.product_id,
            "product_name": product_name,
            "product_sku": product_sku,
            "quantity": item.quantity,
            "unit_price": unit_price,
            "cost_price": cost_price,
            "total": item.total_price if item.total_price and item.total_price > 0 else item_total,
            "subtotal": item_total,
            "discount": 0,
            "variants": str(item.selected_variants) if item.selected_variants else None,
            "sale_type": item.sale_type or "normal",
            "variant_id": item.selected_variants.get("variant_id") if item.selected_variants else None,
            "variant_name": item.selected_variants.get("variant_name") if item.selected_variants else None,
        })
    
    # Calculate totals
    subtotal = order_data.subtotal if order_data.subtotal and order_data.subtotal > 0 else calculated_subtotal
    shipping = order_data.shipping_cost or 0
    total = order_data.total_amount if order_data.total_amount and order_data.total_amount > 0 else (subtotal + shipping)
    
    # Generate order number
    order_number = generate_order_number(db)
    
    # Create order
    order = Order(
        order_number=order_number,
        lead_id=order_data.lead_id,
        customer_name=customer_name or "Call Center Order",
        customer_phone=customer_phone or "",
        delivery_address=address or "",
        city=city or "",
        product_name=", ".join(product_names[:3]) + ("..." if len(product_names) > 3 else "") if product_names else "Order",
        quantity=total_quantity,
        unit_price=subtotal / total_quantity if total_quantity > 0 else 0,
        subtotal=subtotal,
        delivery_charges=shipping,
        total_amount=total,
        notes=order_data.notes,
        status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PENDING,
        is_confirmed=True,
        confirmed_at=datetime.utcnow(),
    )
    
    db.add(order)
    db.flush()  # Get order ID
    
    # Create order items
    for item_data in order_items_data:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product_id"],
            product_name=item_data["product_name"],
            product_sku=item_data["product_sku"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            cost_price=item_data["cost_price"],
            subtotal=item_data["subtotal"],
            discount=item_data.get("discount", 0),
            total=item_data["total"],
            sale_type=item_data.get("sale_type", "normal"),
            variant_id=item_data.get("variant_id"),
            variant_name=item_data.get("variant_name"),
        )
        db.add(order_item)
    
    # Update lead status if lead_id provided
    if order_data.lead_id:
        lead = db.query(Lead).filter(Lead.id == order_data.lead_id).first()
        if lead:
            lead.status = "CONFIRMED"
    
    db.commit()
    db.refresh(order)
    
    # Add history entry
    add_order_history(
        db, order.id,
        "Order created",
        None, "CONFIRMED",
        f"Created from Call Center with {len(order_items_data)} items",
        current_user.email if hasattr(current_user, 'email') else "Agent"
    )
    
    print(f"✅ Call Center order created: {order.order_number}")
    
    return {
        "success": True,
        "id": order.id,
        "order_number": order.order_number,
        "total_amount": order.total_amount,
        "items_count": len(order_items_data),
        "message": f"Order {order.order_number} created successfully"
    }

@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    """
    Create a new COD order from a lead
    """
    print(f"📦 Creating order for lead: {order_data.lead_id}")
    
    # Check if lead exists
    lead = db.query(Lead).filter(Lead.id == order_data.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Calculate totals
    subtotal = order_data.unit_price * order_data.quantity
    total_amount = subtotal + order_data.delivery_charges
    
    # Generate order number
    order_number = generate_order_number(db)
    
    # Create order
    order = Order(
        order_number=order_number,
        lead_id=order_data.lead_id,
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        customer_email=order_data.customer_email,
        delivery_address=order_data.delivery_address,
        city=order_data.city,
        postal_code=order_data.postal_code,
        product_name=order_data.product_name,
        quantity=order_data.quantity,
        unit_price=order_data.unit_price,
        subtotal=subtotal,
        delivery_charges=order_data.delivery_charges,
        total_amount=total_amount,
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        notes=order_data.notes
    )
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Add to history
    add_order_history(
        db, order.id,
        "Order created",
        None, "PENDING",
        f"Order created from lead #{order_data.lead_id}",
        "System"
    )
    
    # Update lead status to CONFIRMED
    try:
        lead.status = "CONFIRMED"
        db.commit()
    except Exception as e:
        print(f"⚠️ Could not update lead status: {e}")
        # Continue even if status update fails
    
    print(f"✅ Order created: {order.order_number}")
    return order

@router.get("/")
def get_orders(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get all orders with filtering and pagination
    """
    print(f"📦 Fetching orders (status: {status}, search: {search})")
    
    try:
        query = db.query(Order)
        
        # Filter by status
        if status:
            try:
                status_enum = OrderStatus(status)
                query = query.filter(Order.status == status_enum)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
        
        # Search
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (Order.order_number.ilike(search_filter)) |
                (Order.customer_name.ilike(search_filter)) |
                (Order.customer_phone.ilike(search_filter))
            )
        
        # Get total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * per_page
        orders = query.order_by(Order.created_at.desc()).offset(offset).limit(per_page).all()
        
        print(f"✅ Found {total} orders, returning page {page}")
        
        # Manual mapping to avoid Pydantic enum issues
        orders_data = []
        for o in orders:
            orders_data.append({
                "id": o.id,
                "order_number": o.order_number or "",
                "lead_id": o.lead_id,
                "customer_name": o.customer_name or "",
                "customer_phone": o.customer_phone or "",
                "customer_email": o.customer_email,
                "delivery_address": o.delivery_address or "",
                "city": o.city or "",
                "postal_code": o.postal_code,
                "product_name": o.product_name or "",
                "quantity": o.quantity or 1,
                "unit_price": o.unit_price or 0.0,
                "subtotal": o.subtotal or 0.0,
                "delivery_charges": o.delivery_charges or 0.0,
                "total_amount": o.total_amount or 0.0,
                "status": o.status.value if o.status else "PENDING",
                "payment_status": o.payment_status.value if o.payment_status else "PENDING",
                "delivery_partner": o.delivery_partner,
                "tracking_number": o.tracking_number,
                "notes": o.notes,
                "is_confirmed": o.is_confirmed or False,
                "confirmed_by": o.confirmed_by,
                "confirmed_at": o.confirmed_at,
                "shipped_at": o.shipped_at,
                "delivered_at": o.delivered_at,
                "delivery_attempts": o.delivery_attempts or 0,
                "delivery_failed": o.delivery_failed or False,
                "failure_reason": o.failure_reason,
                "payment_collected": o.payment_collected or False,
                "cash_collected": o.cash_collected or 0.0,
                "is_returned": o.is_returned or False,
                "return_reason": o.return_reason,
                "created_at": o.created_at,
                "updated_at": o.updated_at,
            })
        
        return {
            "orders": orders_data,
            "total": total,
            "page": page,
            "per_page": per_page
        }
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        print(f"CRITICAL ERROR IN GET_ORDERS: {e}")
        try:
            with open("/tmp/orders_debug.log", "w") as f:
                f.write(error_msg)
        except:
            pass
        raise

@router.get("/stats/summary")
def get_order_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """
    Get order statistics and analytics
    """
    from sqlalchemy import func
    
    query = db.query(Order)
    
    if start_date:
        query = query.filter(Order.created_at >= start_date)
    if end_date:
        query = query.filter(Order.created_at <= end_date)
    
    total_orders = query.count()
    pending = query.filter(Order.status == OrderStatus.PENDING).count()
    confirmed = query.filter(Order.status == OrderStatus.CONFIRMED).count()
    shipped = query.filter(Order.status == OrderStatus.SHIPPED).count()
    delivered = query.filter(Order.status == OrderStatus.DELIVERED).count()
    returned = query.filter(Order.status == OrderStatus.RETURNED).count()
    cancelled = query.filter(Order.status == OrderStatus.CANCELLED).count()
    failed = query.filter(Order.status == OrderStatus.FAILED).count()
    
    # Revenue calculations
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.status == OrderStatus.DELIVERED
    ).scalar() or 0
    
    collected_amount = db.query(func.sum(Order.cash_collected)).filter(
        Order.payment_status == PaymentStatus.PAID
    ).scalar() or 0
    
    return {
        "total_orders": total_orders,
        "by_status": {
            "pending": pending,
            "confirmed": confirmed,
            "shipped": shipped,
            "delivered": delivered,
            "returned": returned,
            "cancelled": cancelled,
            "failed": failed
        },
        "rates": {
            "delivery_rate": round((delivered / (delivered + returned + failed) * 100), 2) if (delivered + returned + failed) > 0 else 0,
            "return_rate": round((returned / (delivered + returned) * 100), 2) if (delivered + returned) > 0 else 0,
            "cancellation_rate": round((cancelled / total_orders * 100), 2) if total_orders > 0 else 0
        },
        "revenue": {
            "total_revenue": total_revenue,
            "collected_amount": collected_amount,
            "pending_collection": total_revenue - collected_amount
        }
    }

@router.get("/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    """
    Get a specific order by ID with items
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get order items
    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    
    # Build response with items
    response = {
        "id": order.id,
        "order_number": order.order_number or "",
        "lead_id": order.lead_id,
        "customer_name": order.customer_name or "",
        "customer_phone": order.customer_phone or "",
        "customer_email": order.customer_email,
        "delivery_address": order.delivery_address or "",
        "city": order.city or "",
        "postal_code": order.postal_code,
        "product_name": order.product_name or "",
        "product_sku": getattr(order, 'product_sku', None),
        "quantity": order.quantity or 1,
        "unit_price": order.unit_price or 0.0,
        "subtotal": order.subtotal or 0.0,
        "delivery_charges": order.delivery_charges or 0.0,
        "total_amount": order.total_amount or 0.0,
        "status": order.status.value if order.status else "PENDING",
        "payment_status": order.payment_status.value if order.payment_status else "PENDING",
        "is_confirmed": order.is_confirmed or False,
        "confirmed_by": order.confirmed_by,
        "confirmed_at": order.confirmed_at,
        "courier": order.courier,
        "courier_tracking_url": order.courier_tracking_url,
        "tracking_number": order.tracking_number,
        "delivery_partner": order.delivery_partner,
        "delivery_attempts": order.delivery_attempts or 0,
        "shipped_at": order.shipped_at,
        "delivered_at": order.delivered_at,
        "delivery_failed": order.delivery_failed or False,
        "failure_reason": order.failure_reason,
        "payment_collected": order.payment_collected or False,
        "cash_collected": order.cash_collected,
        "is_returned": order.is_returned or False,
        "return_reason": order.return_reason,
        "notes": order.notes,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        # Logistics fields
        "utm_source": order.utm_source,
        "utm_medium": order.utm_medium,
        "utm_campaign": order.utm_campaign,
        "sales_action": order.sales_action,
        "shipping_company": order.shipping_company,
        "is_exchange": order.is_exchange or False,
        "original_order_ref": order.original_order_ref,
        "exchange_reason": order.exchange_reason,
        "estimated_delivery_date": order.estimated_delivery_date,
        "actual_delivery_date": order.actual_delivery_date,
        # Items array
        "items": [
            {
                "id": item.id,
                "order_id": item.order_id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "product_sku": item.product_sku,
                "variant_id": item.variant_id,
                "variant_name": item.variant_name,
                "unit_price": item.unit_price,
                "cost_price": item.cost_price or 0,
                "quantity": item.quantity,
                "subtotal": item.subtotal,
                "discount": item.discount or 0,
                "total": item.total,
                "sale_type": item.sale_type or "normal",
            }
            for item in items
        ],
    }
    
    return response

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order_data: OrderUpdate,
    db: Session = Depends(get_db)
):
    """
    Update order details
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.status.value if order.status else None
    
    # Update fields
    update_dict = order_data.model_dump(exclude_unset=True)
    
    # Recalculate totals if prices changed
    if 'unit_price' in update_dict or 'quantity' in update_dict or 'delivery_charges' in update_dict:
        unit_price = update_dict.get('unit_price', order.unit_price)
        quantity = update_dict.get('quantity', order.quantity)
        delivery_charges = update_dict.get('delivery_charges', order.delivery_charges)
        
        subtotal = unit_price * quantity
        total_amount = subtotal + delivery_charges
        
        update_dict['subtotal'] = subtotal
        update_dict['total_amount'] = total_amount
    
    # Handle status update
    if 'status' in update_dict:
        try:
            update_dict['status'] = OrderStatus(update_dict['status'])
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {update_dict['status']}")
    
    for key, value in update_dict.items():
        setattr(order, key, value)
    
    db.commit()
    db.refresh(order)
    
    new_status = order.status.value if order.status else None
    
    add_order_history(
        db, order.id,
        "Order updated",
        old_status, new_status,
        "Order details updated",
        "System"
    )
    
    return order

@router.post("/{order_id}/confirm", response_model=OrderResponse)
def confirm_order(
    order_id: int,
    confirm_data: OrderConfirm,
    db: Session = Depends(get_db)
):
    """
    Confirm order after customer verification call
    """
    print(f"✅ Confirming order #{order_id}")
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.status.value if order.status else None
    
    order.is_confirmed = True
    order.confirmed_by = confirm_data.confirmed_by
    order.confirmed_at = datetime.utcnow()
    order.status = OrderStatus.CONFIRMED
    
    db.commit()
    db.refresh(order)
    
    add_order_history(
        db, order.id,
        "Order confirmed",
        old_status, "CONFIRMED",
        confirm_data.notes or f"Confirmed by {confirm_data.confirmed_by}",
        confirm_data.confirmed_by
    )
    
    print(f"✅ Order {order.order_number} confirmed")
    return order

@router.post("/{order_id}/cancel")
def cancel_order(
    order_id: int,
    reason: str = Query(...),
    cancelled_by: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Cancel an order
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.status.value if order.status else None
    order.status = OrderStatus.CANCELLED
    
    db.commit()
    db.refresh(order)
    
    add_order_history(
        db, order.id,
        "Order cancelled",
        old_status, "CANCELLED",
        f"Reason: {reason}",
        cancelled_by
    )
    
    return order

@router.post("/{order_id}/ship", response_model=OrderResponse)
def ship_order(
    order_id: int,
    shipping_data: OrderShipping,
    db: Session = Depends(get_db)
):
    """
    Mark order as shipped with tracking info
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if not order.is_confirmed:
        raise HTTPException(status_code=400, detail="Order must be confirmed before shipping")
    
    old_status = order.status.value if order.status else None
    
    order.status = OrderStatus.SHIPPED
    order.tracking_number = shipping_data.tracking_number
    order.delivery_partner = shipping_data.delivery_partner
    order.shipped_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    add_order_history(
        db, order.id,
        "Order shipped",
        old_status, "SHIPPED",
        f"Tracking: {shipping_data.tracking_number}, Partner: {shipping_data.delivery_partner}",
        "System"
    )
    
    return order

@router.post("/{order_id}/out-for-delivery", response_model=OrderResponse)
def mark_out_for_delivery(
    order_id: int,
    db: Session = Depends(get_db)
):
    """
    Mark order as out for delivery
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.status.value if order.status else None
    
    order.status = OrderStatus.OUT_FOR_DELIVERY
    order.out_for_delivery_at = datetime.utcnow()
    order.delivery_attempts += 1
    order.last_delivery_attempt = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    add_order_history(
        db, order.id,
        "Out for delivery",
        old_status, "OUT_FOR_DELIVERY",
        f"Delivery attempt #{order.delivery_attempts}",
        "System"
    )
    
    return order

@router.post("/{order_id}/deliver", response_model=OrderResponse)
def deliver_order(
    order_id: int,
    delivery_data: OrderDelivery,
    db: Session = Depends(get_db)
):
    """
    Mark order as delivered or failed
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.status.value if order.status else None
    
    if delivery_data.success:
        # Successful delivery
        order.status = OrderStatus.DELIVERED
        order.delivered_at = datetime.utcnow()
        order.payment_collected = True
        order.payment_collected_at = datetime.utcnow()
        order.payment_status = PaymentStatus.PAID
        order.cash_collected = delivery_data.cash_collected or order.total_amount
        
        add_order_history(
            db, order.id,
            "Order delivered",
            old_status, "DELIVERED",
            f"Cash collected: {order.cash_collected} MAD",
            "Delivery Partner"
        )
    else:
        # Failed delivery
        order.status = OrderStatus.FAILED
        order.delivery_failed = True
        order.failure_reason = delivery_data.failure_reason
        
        add_order_history(
            db, order.id,
            "Delivery failed",
            old_status, "FAILED",
            f"Reason: {delivery_data.failure_reason}",
            "Delivery Partner"
        )
    
    db.commit()
    db.refresh(order)
    
    return order

@router.post("/{order_id}/return", response_model=OrderResponse)
def return_order(
    order_id: int,
    return_data: OrderReturn,
    db: Session = Depends(get_db)
):
    """
    Process order return
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.status.value if order.status else None
    
    order.status = OrderStatus.RETURNED
    order.is_returned = True
    order.return_reason = return_data.return_reason
    order.returned_at = datetime.utcnow()
    order.payment_status = PaymentStatus.REFUNDED
    
    db.commit()
    db.refresh(order)
    
    add_order_history(
        db, order.id,
        "Order returned",
        old_status, "RETURNED",
        f"Reason: {return_data.return_reason}",
        "System"
    )
    
    return order

@router.get("/{order_id}/history", response_model=List[OrderHistoryResponse])
def get_order_history(order_id: int, db: Session = Depends(get_db)):
    """
    Get order history (all status changes and actions)
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    history = db.query(OrderHistory).filter(
        OrderHistory.order_id == order_id
    ).order_by(OrderHistory.created_at.desc()).all()
    
    return history


# ============ MULTI-PRODUCT ORDER ENDPOINTS ============

@router.post("/with-items", response_model=OrderResponse)
def create_order_with_items(
    order_data: OrderCreateWithItems,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new order with multiple products
    """
    from app.models.product import Product
    from app.services.product_service import ProductService
    
    print(f"📦 Creating multi-product order for lead: {order_data.lead_id}")
    
    # Get the lead
    lead = db.query(Lead).filter(Lead.id == order_data.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Get product service
    product_service = ProductService(db)
    
    # Validate and calculate items
    order_items_data = []
    items_subtotal = 0
    total_cost = 0
    product_names = []
    total_quantity = 0
    
    for item_data in order_data.items:
        product = product_service.get_product_by_id(item_data.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_data.product_id} not found")
        
        if not product.is_active:
            raise HTTPException(status_code=400, detail=f"Product {product.name} is not active")
        
        # Check stock
        if product.track_inventory and product.stock_quantity < item_data.quantity:
            if not product.allow_backorder:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.name}. Available: {product.stock_quantity}"
                )
        
        # Calculate item totals
        subtotal = product.selling_price * item_data.quantity
        item_total = subtotal - item_data.discount
        
        order_items_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "product_sku": product.sku,
            "unit_price": product.selling_price,
            "cost_price": product.cost_price,
            "quantity": item_data.quantity,
            "subtotal": subtotal,
            "discount": item_data.discount,
            "total": item_total,
        })
        
        items_subtotal += item_total
        total_cost += product.cost_price * item_data.quantity
        product_names.append(product.name)
        total_quantity += item_data.quantity
    
    # Calculate order total
    total_amount = items_subtotal + order_data.shipping_cost - order_data.discount
    
    # Generate order number
    order_number = generate_order_number(db)
    
    # Create order
    order = Order(
        order_number=order_number,
        lead_id=lead.id,
        customer_name=lead.first_name + (" " + lead.last_name if lead.last_name else ""),
        customer_phone=lead.phone,
        customer_email=lead.email,
        delivery_address=order_data.shipping_address,
        city=order_data.shipping_city,
        postal_code=order_data.shipping_postal_code,
        product_name=", ".join(product_names[:3]) + ("..." if len(product_names) > 3 else ""),
        quantity=total_quantity,
        unit_price=items_subtotal / total_quantity if total_quantity > 0 else 0,
        subtotal=items_subtotal,
        delivery_charges=order_data.shipping_cost,
        total_amount=total_amount,
        notes=order_data.order_notes,
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING
    )
    
    db.add(order)
    db.flush()  # Get order ID
    
    # Create order items
    for item_data in order_items_data:
        order_item = OrderItem(
            order_id=order.id,
            **item_data
        )
        db.add(order_item)
    
    # Reduce stock for each product
    for item_data in order_data.items:
        try:
            product_service.reduce_stock_for_order(
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                order_id=order.id,
                user_id=current_user.id
            )
        except Exception as e:
            print(f"⚠️ Stock reduction error: {e}")
    
    db.commit()
    db.refresh(order)
    
    # Add history entry
    add_order_history(
        db, order.id,
        "Order created",
        None, "PENDING",
        f"Order created with {len(order_items_data)} items (Total: {total_amount} MAD)",
        "System"
    )
    
    print(f"✅ Multi-product order created: {order.order_number} with {len(order_items_data)} items")
    return order


@router.get("/products/available")
def get_available_products(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get available products for order creation
    """
    from app.services.product_service import ProductService
    service = ProductService(db)
    result = service.get_products(
        page=1,
        page_size=100,
        search=search,
        category_id=category_id,
        is_active=True
    )
    # Only return products with stock or that allow backorder
    products = [p for p in result["products"] if p.stock_quantity > 0 or p.allow_backorder]
    return {"products": products}


@router.get("/{order_id}/items", response_model=List[OrderItemResponse])
def get_order_items(
    order_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all items in an order
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order.items


@router.post("/{order_id}/cancel-with-stock")
def cancel_order_with_stock_restore(
    order_id: int,
    reason: str = Query(..., description="Cancellation reason"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Cancel an order and restore stock
    """
    from app.services.product_service import ProductService
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status in [OrderStatus.DELIVERED, OrderStatus.RETURNED]:
        raise HTTPException(status_code=400, detail="Cannot cancel delivered or returned orders")
    
    old_status = order.status.value if order.status else None
    
    # Restore stock if order hasn't been shipped yet
    if order.status in [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING]:
        product_service = ProductService(db)
        for item in order.items:
            try:
                product_service.restore_stock_for_return(
                    product_id=item.product_id,
                    quantity=item.quantity,
                    order_id=order.id,
                    user_id=current_user.id
                )
            except Exception as e:
                print(f"⚠️ Stock restore error: {e}")
    
    order.status = OrderStatus.CANCELLED
    
    add_order_history(
        db, order.id,
        "Order cancelled with stock restored",
        old_status, "CANCELLED",
        f"Reason: {reason}",
        "System"
    )
    
    db.commit()
    db.refresh(order)
    
    return order


@router.post("/{order_id}/return-with-stock")
def return_order_with_stock_restore(
    order_id: int,
    return_data: OrderReturn,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Mark order as returned and restore stock
    """
    from app.services.product_service import ProductService
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.status.value if order.status else None
    
    # Restore stock for each item
    product_service = ProductService(db)
    for item in order.items:
        try:
            product_service.restore_stock_for_return(
                product_id=item.product_id,
                quantity=item.quantity,
                order_id=order.id,
                user_id=current_user.id
            )
        except Exception as e:
            print(f"⚠️ Stock restore error: {e}")
    
    # Update order status
    order.status = OrderStatus.RETURNED
    order.is_returned = True
    order.return_reason = return_data.return_reason
    order.returned_at = datetime.utcnow()
    order.payment_status = PaymentStatus.PENDING
    
    add_order_history(
        db, order.id,
        "Order returned with stock restored",
        old_status, "RETURNED",
        f"Reason: {return_data.return_reason}",
        "System"
    )
    
    db.commit()
    db.refresh(order)
    
    return order


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """
    Delete an order
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db.delete(order)
    db.commit()
    
    return {"message": "Order deleted successfully"}


@router.get("/{order_id}/label")
async def generate_shipping_label(
    order_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate a 10x15cm shipping label PDF for an order.
    Returns a downloadable PDF file.
    """
    from fastapi.responses import StreamingResponse
    from app.services.label_service import LabelService
    
    # Get order with items
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get lead info
    lead = db.query(Lead).filter(Lead.id == order.lead_id).first()
    
    # Build customer name
    if lead:
        customer_name = lead.first_name or ""
        if lead.last_name:
            customer_name += " " + lead.last_name
        customer_name = customer_name.strip() or "Client"
        phone = lead.phone or ""
    else:
        customer_name = order.customer_name or "Client"
        phone = order.customer_phone or ""
    
    # Prepare data for label
    label_data = {
        "order_number": order.order_number,
        "date": order.created_at.strftime("%d/%m/%Y") if order.created_at else "",
        "sender_name": "COD Express",
        "sender_phone": "+212 600 000 000",
        "customer_name": customer_name,
        "phone": phone,
        "address": order.delivery_address or "",
        "city": order.city or "",
        "items": [
            {
                "sku": item.product_sku,
                "name": item.product_name,
                "qty": item.quantity
            }
            for item in order.items
        ] if order.items else [
            {
                "sku": "PROD",
                "name": order.product_name or "Product",
                "qty": order.quantity or 1
            }
        ],
        "cod_amount": order.total_amount or 0,
        "courier": getattr(order, 'courier', None) or "AMANA"
    }
    
    # Generate PDF
    label_service = LabelService()
    pdf_buffer = label_service.generate_shipping_label(label_data)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=label_{order.order_number}.pdf"
        }
    )


# ============== BULK OPERATIONS ==============

from pydantic import BaseModel

class BulkOrderUpdateRequest(BaseModel):
    """Schema for bulk order status update"""
    ids: List[int]
    status: str


class BulkOrderDeleteRequest(BaseModel):
    """Schema for bulk delete"""
    ids: List[int]


@router.post("/bulk-update")
def bulk_update_orders(
    data: BulkOrderUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Bulk update order statuses.
    Maximum 100 orders per request.
    """
    print(f"📦 BULK UPDATE - {len(data.ids)} orders to status: {data.status}")
    
    if not data.ids:
        raise HTTPException(status_code=400, detail="No order IDs provided")
    
    if len(data.ids) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 orders per bulk update")
    
    # Validate status
    try:
        new_status = OrderStatus(data.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {data.status}")
    
    try:
        # Perform bulk update
        result = db.query(Order).filter(Order.id.in_(data.ids)).update(
            {"status": new_status, "updated_at": datetime.utcnow()},
            synchronize_session=False
        )
        
        db.commit()
        
        print(f"✅ Bulk updated {result} orders to {data.status}")
        
        return {
            "success": True,
            "message": f"Successfully updated {result} orders to {data.status}",
            "updated_count": result,
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Bulk update error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Bulk update failed: {str(e)}")


@router.post("/bulk-delete")
def bulk_delete_orders(
    data: BulkOrderDeleteRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Bulk delete orders.
    Maximum 100 orders per request.
    """
    print(f"🗑️ BULK DELETE - {len(data.ids)} orders")
    
    if not data.ids:
        raise HTTPException(status_code=400, detail="No order IDs provided")
    
    if len(data.ids) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 orders per bulk delete")
    
    try:
        # Perform bulk delete
        result = db.query(Order).filter(Order.id.in_(data.ids)).delete(
            synchronize_session=False
        )
        
        db.commit()
        
        print(f"✅ Bulk deleted {result} orders")
        
        return {
            "success": True,
            "message": f"Successfully deleted {result} orders",
            "deleted_count": result,
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Bulk delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Bulk delete failed: {str(e)}")
