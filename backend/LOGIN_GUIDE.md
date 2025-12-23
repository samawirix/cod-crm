# 🔐 CRM Login Guide

## ✅ Authentication System Ready!

Your CRM now has full JWT authentication with login and register endpoints.

---

## 👤 Default Users

### Admin Account
- **Email:** `admin@crm.com`
- **Password:** `admin123`
- **Role:** Administrator (full access)
- **User ID:** 1

### Agent Account  
- **Email:** `agent@crm.com`
- **Password:** `agent123`
- **Role:** Sales Agent
- **User ID:** 2

---

## 🔑 How to Login

### 1. Login Endpoint

**POST** `http://localhost:8000/api/v1/auth/login`

**Request:**
```json
{
  "email": "admin@crm.com",
  "password": "admin123"
}
```

**Response:**
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

### 2. Use Token in Requests

Include the token in all API requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 💻 Frontend Integration

### JavaScript/TypeScript Example

```javascript
// authService.js

const API_BASE_URL = 'http://localhost:8000';

class AuthService {
  // Login
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }
    
    const data = await response.json();
    
    // Store token in localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify({
      id: data.user_id,
      username: data.username,
      email: data.email,
      full_name: data.full_name
    }));
    
    return data;
  }
  
  // Register
  async register(username, email, fullName, password) {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        full_name: fullName,
        password
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }
    
    const data = await response.json();
    
    // Store token
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify({
      id: data.user_id,
      username: data.username,
      email: data.email,
      full_name: data.full_name
    }));
    
    return data;
  }
  
  // Logout
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }
  
  // Get current token
  getToken() {
    return localStorage.getItem('access_token');
  }
  
  // Get current user
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  
  // Check if logged in
  isLoggedIn() {
    return !!this.getToken();
  }
  
  // Get auth headers for API requests
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
}

export default new AuthService();
```

### Usage in Components

```javascript
import authService from './services/authService';

// Login
async function handleLogin() {
  try {
    const data = await authService.login('admin@crm.com', 'admin123');
    console.log('Logged in:', data.full_name);
    // Redirect to dashboard
  } catch (error) {
    console.error('Login error:', error.message);
  }
}

// Make authenticated API calls
async function getLeads() {
  const response = await fetch('http://localhost:8000/api/v1/leads', {
    headers: authService.getAuthHeaders()
  });
  const data = await response.json();
  return data.leads;
}
```

---

## 🧪 Test with curl

### Login as Admin
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"admin123"}'
```

### Login as Agent
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@crm.com","password":"agent123"}'
```

### Use Token
```bash
# Copy the access_token from login response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Access protected endpoint
curl http://localhost:8000/api/v1/leads \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📝 Registration Endpoint

Create new users via API:

**POST** `http://localhost:8000/api/v1/auth/register`

```json
{
  "username": "newuser",
  "email": "newuser@crm.com",
  "full_name": "New User",
  "password": "password123"
}
```

---

## 🔒 Security Features

- ✅ **Password Hashing:** Bcrypt with 12 rounds
- ✅ **JWT Tokens:** 30-minute expiration
- ✅ **Secure Storage:** Passwords never stored in plain text
- ✅ **Token Validation:** All endpoints verify JWT
- ✅ **User Roles:** Admin and regular users

---

## 📚 API Documentation

View all auth endpoints at:
- **Swagger UI:** http://localhost:8000/docs
- Look for the **"authentication"** tag

---

## ⚠️ Important Notes

1. **Default passwords are for development only** - Change in production!
2. **Secret key is hardcoded** - Use environment variables in production
3. **Tokens expire in 30 minutes** - Implement refresh tokens for production
4. **Database is SQLite** - Works great for development, use PostgreSQL for production

---

## 🎯 Quick Start for Frontend

1. **Login:**
   ```javascript
   const res = await fetch('http://localhost:8000/api/v1/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'admin@crm.com',
       password: 'admin123'
     })
   });
   const { access_token } = await res.json();
   ```

2. **Store token:**
   ```javascript
   localStorage.setItem('token', access_token);
   ```

3. **Use in requests:**
   ```javascript
   const token = localStorage.getItem('token');
   fetch('http://localhost:8000/api/v1/leads', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });
   ```

---

## ✅ Verified Working

- ✅ Login endpoint functional
- ✅ JWT tokens generated correctly
- ✅ Token authentication working
- ✅ Default users created
- ✅ Password hashing secure
- ✅ CORS configured for frontend (port 8080)

**Ready to use in your frontend!** 🚀

