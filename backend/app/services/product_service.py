from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional
from datetime import datetime

from app.models.product import Product, Category, StockMovement
from app.schemas.product import ProductCreate, ProductUpdate, StockAdjustment


class ProductService:
    def __init__(self, db: Session):
        self.db = db
    
    # ============ CATEGORY METHODS ============
    
    def get_categories(self, include_inactive: bool = False):
        """Get all categories"""
        query = self.db.query(Category)
        if not include_inactive:
            query = query.filter(Category.is_active == True)
        return query.order_by(Category.name).all()
    
    def create_category(self, name: str, description: str = None, parent_id: int = None):
        """Create a new category"""
        category = Category(
            name=name,
            description=description,
            parent_id=parent_id
        )
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def update_category(self, category_id: int, **kwargs):
        """Update a category"""
        category = self.db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise ValueError("Category not found")
        
        for key, value in kwargs.items():
            if hasattr(category, key) and value is not None:
                setattr(category, key, value)
        
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def delete_category(self, category_id: int):
        """Delete a category (soft delete by deactivating)"""
        category = self.db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise ValueError("Category not found")
        
        category.is_active = False
        self.db.commit()
        return True
    
    # ============ PRODUCT METHODS ============
    
    def get_products(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        is_active: Optional[bool] = None,
        is_featured: Optional[bool] = None,
        low_stock_only: bool = False,
        out_of_stock_only: bool = False,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ):
        """Get paginated list of products with filters"""
        
        # Use joinedload to eagerly load product_variants
        query = self.db.query(Product).options(joinedload(Product.product_variants))
        
        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.sku.ilike(search_term),
                    Product.barcode.ilike(search_term),
                    Product.description.ilike(search_term)
                )
            )
        
        if category_id:
            query = query.filter(Product.category_id == category_id)
        
        if is_active is not None:
            query = query.filter(Product.is_active == is_active)
        
        if is_featured is not None:
            query = query.filter(Product.is_featured == is_featured)
        
        if low_stock_only:
            query = query.filter(Product.stock_quantity <= Product.low_stock_threshold)
        
        if out_of_stock_only:
            query = query.filter(Product.stock_quantity <= 0)
        
        # Get total count
        total = query.count()
        
        # Apply sorting
        sort_column = getattr(Product, sort_by, Product.created_at)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Apply pagination
        offset = (page - 1) * page_size
        products = query.offset(offset).limit(page_size).all()
        
        # Add category name and calculate total stock for each product
        for product in products:
            if product.category:
                product.category_name = product.category.name
            else:
                product.category_name = None
            
            # Calculate total stock from variants if product has variants
            if product.product_variants and len(product.product_variants) > 0:
                total_variant_stock = sum(v.stock_quantity for v in product.product_variants if v.is_active)
                product.stock_quantity = total_variant_stock
                product.variant_count = len([v for v in product.product_variants if v.is_active])
            else:
                product.variant_count = 0
        
        total_pages = (total + page_size - 1) // page_size
        
        return {
            "products": products,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    
    def get_product_by_id(self, product_id: int) -> Optional[Product]:
        """Get product by ID with variants eagerly loaded"""
        product = self.db.query(Product)\
            .options(joinedload(Product.product_variants))\
            .filter(Product.id == product_id)\
            .first()
        
        if product:
            # Set category name
            if product.category:
                product.category_name = product.category.name
            else:
                product.category_name = None
            
            # Calculate total stock from variants if product has variants
            if product.product_variants and len(product.product_variants) > 0:
                total_variant_stock = sum(v.stock_quantity for v in product.product_variants if v.is_active)
                product.stock_quantity = total_variant_stock
                product.variant_count = len([v for v in product.product_variants if v.is_active])
            else:
                product.variant_count = 0
        
        return product
    
    def get_product_by_sku(self, sku: str) -> Optional[Product]:
        """Get product by SKU"""
        return self.db.query(Product).filter(Product.sku == sku).first()
    
    def create_product(self, product_data: ProductCreate, user_id: int = None) -> Product:
        """Create a new product"""
        
        # Check if SKU already exists
        existing = self.get_product_by_sku(product_data.sku)
        if existing:
            raise ValueError(f"Product with SKU '{product_data.sku}' already exists")
        
        product = Product(**product_data.model_dump())
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        
        # Record initial stock if provided
        if product_data.stock_quantity > 0:
            self._record_stock_movement(
                product_id=product.id,
                movement_type="IN",
                quantity=product_data.stock_quantity,
                previous_stock=0,
                new_stock=product_data.stock_quantity,
                reference_type="INITIAL",
                notes="Initial stock",
                user_id=user_id
            )
        
        if product.category:
            product.category_name = product.category.name
        else:
            product.category_name = None
        
        return product
    
    def update_product(self, product_id: int, product_data: ProductUpdate) -> Product:
        """Update a product"""
        
        product = self.get_product_by_id(product_id)
        if not product:
            raise ValueError("Product not found")
        
        update_data = product_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(product, key, value)
        
        self.db.commit()
        self.db.refresh(product)
        
        if product.category:
            product.category_name = product.category.name
        else:
            product.category_name = None
        
        return product
    
    def delete_product(self, product_id: int) -> bool:
        """Soft delete a product"""
        product = self.get_product_by_id(product_id)
        if not product:
            raise ValueError("Product not found")
        
        product.is_active = False
        self.db.commit()
        return True
    
    # ============ STOCK METHODS ============
    
    def adjust_stock(self, product_id: int, adjustment: StockAdjustment, user_id: int = None) -> Product:
        """Adjust stock quantity"""
        
        product = self.get_product_by_id(product_id)
        if not product:
            raise ValueError("Product not found")
        
        previous_stock = product.stock_quantity
        new_stock = previous_stock + adjustment.quantity
        
        if new_stock < 0 and not product.allow_backorder:
            raise ValueError("Cannot reduce stock below 0")
        
        product.stock_quantity = new_stock
        
        # Record movement
        movement_type = "IN" if adjustment.quantity > 0 else "OUT"
        self._record_stock_movement(
            product_id=product_id,
            movement_type=movement_type,
            quantity=adjustment.quantity,
            previous_stock=previous_stock,
            new_stock=new_stock,
            reference_type="ADJUSTMENT",
            notes=f"{adjustment.reason}: {adjustment.notes or ''}",
            user_id=user_id
        )
        
        self.db.commit()
        self.db.refresh(product)
        
        if product.category:
            product.category_name = product.category.name
        else:
            product.category_name = None
        
        return product
    
    def reduce_stock_for_order(self, product_id: int, quantity: int, order_id: int, user_id: int = None) -> Product:
        """Reduce stock when order is placed"""
        
        product = self.get_product_by_id(product_id)
        if not product:
            raise ValueError("Product not found")
        
        if product.track_inventory:
            previous_stock = product.stock_quantity
            new_stock = previous_stock - quantity
            
            if new_stock < 0 and not product.allow_backorder:
                raise ValueError(f"Insufficient stock. Available: {previous_stock}")
            
            product.stock_quantity = new_stock
            product.total_sold += quantity
            product.total_revenue += quantity * product.selling_price
            
            self._record_stock_movement(
                product_id=product_id,
                movement_type="OUT",
                quantity=-quantity,
                previous_stock=previous_stock,
                new_stock=new_stock,
                reference_type="ORDER",
                reference_id=order_id,
                notes=f"Order #{order_id}",
                user_id=user_id,
                cost_per_unit=product.cost_price
            )
            
            self.db.commit()
            self.db.refresh(product)
        
        return product
    
    def restore_stock_for_return(self, product_id: int, quantity: int, order_id: int, user_id: int = None) -> Product:
        """Restore stock when order is returned"""
        
        product = self.get_product_by_id(product_id)
        if not product:
            raise ValueError("Product not found")
        
        if product.track_inventory:
            previous_stock = product.stock_quantity
            new_stock = previous_stock + quantity
            
            product.stock_quantity = new_stock
            
            self._record_stock_movement(
                product_id=product_id,
                movement_type="IN",
                quantity=quantity,
                previous_stock=previous_stock,
                new_stock=new_stock,
                reference_type="RETURN",
                reference_id=order_id,
                notes=f"Return from Order #{order_id}",
                user_id=user_id
            )
            
            self.db.commit()
            self.db.refresh(product)
        
        return product
    
    def get_stock_movements(self, product_id: int, limit: int = 50):
        """Get stock movement history for a product"""
        return self.db.query(StockMovement)\
            .filter(StockMovement.product_id == product_id)\
            .order_by(StockMovement.created_at.desc())\
            .limit(limit)\
            .all()
    
    def _record_stock_movement(
        self,
        product_id: int,
        movement_type: str,
        quantity: int,
        previous_stock: int,
        new_stock: int,
        reference_type: str = None,
        reference_id: int = None,
        notes: str = None,
        user_id: int = None,
        cost_per_unit: float = None
    ):
        """Record a stock movement"""
        movement = StockMovement(
            product_id=product_id,
            movement_type=movement_type,
            quantity=quantity,
            previous_stock=previous_stock,
            new_stock=new_stock,
            reference_type=reference_type,
            reference_id=reference_id,
            notes=notes,
            created_by=user_id,
            cost_per_unit=cost_per_unit
        )
        self.db.add(movement)
    
    # ============ STATS METHODS ============
    
    def get_inventory_stats(self):
        """Get inventory statistics"""
        
        products = self.db.query(Product).filter(Product.is_active == True).all()
        
        total_products = len(products)
        active_products = len([p for p in products if p.is_active])
        out_of_stock = len([p for p in products if p.stock_quantity <= 0])
        low_stock = len([p for p in products if p.is_low_stock and not p.is_out_of_stock])
        
        total_stock_value = sum(p.stock_value for p in products)
        total_retail_value = sum(p.stock_quantity * p.selling_price for p in products)
        potential_profit = total_retail_value - total_stock_value
        
        categories_count = self.db.query(Category).filter(Category.is_active == True).count()
        
        return {
            "total_products": total_products,
            "active_products": active_products,
            "out_of_stock": out_of_stock,
            "low_stock": low_stock,
            "total_stock_value": round(total_stock_value, 2),
            "total_retail_value": round(total_retail_value, 2),
            "potential_profit": round(potential_profit, 2),
            "categories_count": categories_count
        }
    
    def get_low_stock_products(self, limit: int = 10):
        """Get products with low stock"""
        products = self.db.query(Product)\
            .filter(Product.is_active == True)\
            .filter(Product.stock_quantity <= Product.low_stock_threshold)\
            .filter(Product.stock_quantity > 0)\
            .order_by(Product.stock_quantity.asc())\
            .limit(limit)\
            .all()
        
        for product in products:
            if product.category:
                product.category_name = product.category.name
            else:
                product.category_name = None
        
        return products
    
    def get_top_selling_products(self, limit: int = 10):
        """Get best selling products"""
        products = self.db.query(Product)\
            .filter(Product.is_active == True)\
            .order_by(Product.total_sold.desc())\
            .limit(limit)\
            .all()
        
        for product in products:
            if product.category:
                product.category_name = product.category.name
            else:
                product.category_name = None
        
        return products
