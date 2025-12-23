"""
Authentication API Endpoints

Login, register, and token management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import LoginSchema, RegisterSchema, TokenResponse, UserResponse
from app.services.auth_service import AuthService
from app.services.exceptions import InvalidDataException
from app.api.dependencies import get_db


# Create router
router = APIRouter(
    prefix="/api/v1/auth",
    tags=["authentication"]
)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login",
    description="Authenticate user and get JWT token"
)
async def login(
    credentials: LoginSchema,
    db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    """
    Login with email and password.
    
    **Returns JWT token for authenticated requests.**
    
    **Example Request:**
    ```json
    {
        "email": "admin@crm.com",
        "password": "admin123"
    }
    ```
    
    **Example Response:**
    ```json
    {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "bearer",
        "user_id": 1,
        "username": "admin",
        "email": "admin@crm.com",
        "full_name": "Admin User"
    }
    ```
    
    **Usage in frontend:**
    ```javascript
    const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@crm.com',
            password: 'admin123'
        })
    });
    const data = await response.json();
    // Store data.access_token and use in subsequent requests:
    // Authorization: Bearer ${data.access_token}
    ```
    
    **Default Users:**
    - Admin: `admin@crm.com` / `admin123`
    - Agent: `agent@crm.com` / `agent123`
    """
    try:
        # Authenticate user
        user = await AuthService.authenticate_user(
            db=db,
            email=credentials.email,
            password=credentials.password
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token = AuthService.create_token_for_user(user)
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register",
    description="Register a new user"
)
async def register(
    user_data: RegisterSchema,
    db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    """
    Register a new user.
    
    **Creates user and returns JWT token.**
    
    **Example Request:**
    ```json
    {
        "username": "newuser",
        "email": "newuser@crm.com",
        "full_name": "New User",
        "password": "password123"
    }
    ```
    
    **Example Response:**
    ```json
    {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "bearer",
        "user_id": 3,
        "username": "newuser",
        "email": "newuser@crm.com",
        "full_name": "New User"
    }
    ```
    """
    try:
        # Create user
        user = await AuthService.create_user(
            db=db,
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            password=user_data.password,
            is_superuser=False
        )
        
        # Create access token
        access_token = AuthService.create_token_for_user(user)
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name
        )
        
    except InvalidDataException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

