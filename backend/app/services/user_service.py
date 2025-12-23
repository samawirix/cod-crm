from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional
from datetime import datetime
from passlib.context import CryptContext

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_users(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ):
        """Get paginated list of users"""
        
        query = self.db.query(User)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(search_term),
                    User.email.ilike(search_term),
                    User.phone.ilike(search_term)
                )
            )
        
        if role:
            query = query.filter(User.role == role)
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        total = query.count()
        
        sort_column = getattr(User, sort_by, User.created_at)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        offset = (page - 1) * page_size
        users = query.offset(offset).limit(page_size).all()
        
        return {
            "users": users,
            "total": total,
            "page": page,
            "page_size": page_size
        }
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()
    
    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user"""
        
        existing = self.get_user_by_email(user_data.email)
        if existing:
            raise ValueError("User with this email already exists")
        
        hashed_password = pwd_context.hash(user_data.password)
        
        # Generate username from email
        username = user_data.email.split("@")[0]
        # Ensure unique username
        base_username = username
        counter = 1
        while self.db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1
        
        user = User(
            email=user_data.email,
            username=username,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            phone=user_data.phone,
            role=user_data.role.value
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def update_user(self, user_id: int, user_data: UserUpdate) -> User:
        """Update user details"""
        
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        update_data = user_data.model_dump(exclude_unset=True)
        
        if 'role' in update_data and update_data['role']:
            update_data['role'] = update_data['role'].value
        
        for key, value in update_data.items():
            setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def change_password(self, user_id: int, current_password: str, new_password: str) -> bool:
        """Change user password"""
        
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        if not pwd_context.verify(current_password, user.hashed_password):
            raise ValueError("Current password is incorrect")
        
        user.hashed_password = pwd_context.hash(new_password)
        self.db.commit()
        return True
    
    def reset_password(self, user_id: int, new_password: str) -> bool:
        """Admin reset user password"""
        
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        user.hashed_password = pwd_context.hash(new_password)
        self.db.commit()
        return True
    
    def deactivate_user(self, user_id: int) -> User:
        """Deactivate a user"""
        
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        user.is_active = False
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def activate_user(self, user_id: int) -> User:
        """Activate a user"""
        
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        user.is_active = True
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_agents(self):
        """Get all active agents"""
        return self.db.query(User).filter(
            User.is_active == True,
            User.role.in_([UserRole.AGENT.value, UserRole.MANAGER.value, UserRole.ADMIN.value])
        ).all()
    
    def update_user_stats(self, user_id: int, stat_type: str, increment: int = 1):
        """Update user statistics"""
        
        user = self.get_user_by_id(user_id)
        if not user:
            return
        
        if stat_type == "leads_assigned":
            user.leads_assigned = (user.leads_assigned or 0) + increment
        elif stat_type == "leads_converted":
            user.leads_converted = (user.leads_converted or 0) + increment
        elif stat_type == "calls_made":
            user.calls_made = (user.calls_made or 0) + increment
        elif stat_type == "orders_created":
            user.orders_created = (user.orders_created or 0) + increment
        
        self.db.commit()
    
    def get_user_performance(self, user_id: int, start_date=None, end_date=None):
        """Get user performance metrics"""
        
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Import here to avoid circular imports
        from app.models.lead import Lead
        from app.models.order import Order
        
        # Get leads assigned to user
        leads_query = self.db.query(Lead).filter(Lead.assigned_to == user_id)
        if start_date:
            leads_query = leads_query.filter(Lead.created_at >= start_date)
        if end_date:
            leads_query = leads_query.filter(Lead.created_at <= end_date)
        
        total_leads = leads_query.count()
        converted_leads = leads_query.filter(Lead.status.in_(['WON', 'DELIVERED', 'CONVERTED'])).count()
        
        # Get orders (simple count for now)
        total_orders = user.orders_created or 0
        
        return {
            "user_id": user_id,
            "user_name": user.full_name,
            "role": user.role,
            "leads": {
                "total": total_leads,
                "converted": converted_leads,
                "conversion_rate": round((converted_leads / total_leads * 100) if total_leads > 0 else 0, 2)
            },
            "calls": {
                "total": user.calls_made or 0,
                "answered": 0,
                "contact_rate": 0
            },
            "orders": {
                "total": total_orders,
                "delivered": 0,
                "revenue": 0
            }
        }
