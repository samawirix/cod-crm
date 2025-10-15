# COD CRM - Complete Cash-on-Delivery CRM System

A full-stack monorepo application for managing Cash-on-Delivery operations with comprehensive authentication, user management, and modern web technologies.

## 🚀 Features

### Backend (FastAPI + Python)
- **JWT Authentication** with 7-day token expiration
- **Role-based Access Control** (Admin, Call Center, Fulfillment, Marketing)
- **User Management** with secure password hashing
- **RESTful API** with automatic documentation
- **PostgreSQL Database** with SQLAlchemy ORM
- **Database Migrations** with Alembic
- **Comprehensive Validation** and error handling
- **CORS Support** for frontend integration

### Frontend (Next.js 14 + TypeScript)
- **Modern React** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for responsive design
- **API Integration** with Axios
- **Real-time Connection Testing**
- **Beautiful Dark Theme UI**

## 📁 Project Structure

```
cod-crm/
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── core/           # Core functionality (auth, database, config)
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── alembic/            # Database migrations
│   ├── tests/              # Test files
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js 14 TypeScript frontend
│   ├── app/                # App Router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and API client
│   ├── types/              # TypeScript type definitions
│   └── package.json        # Node.js dependencies
├── shared/                 # Shared utilities
└── README.md              # This file
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Python SQL toolkit and ORM
- **PostgreSQL** - Reliable database
- **Alembic** - Database migration tool
- **Pydantic** - Data validation using Python type annotations
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing
- **Uvicorn** - ASGI server

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **Lucide React** - Icon library

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 12+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/cod-crm.git
cd cod-crm
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Seed test data
python -m app.core.seed

# Start the server
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API URL

# Start the development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Test Connection**: http://localhost:3000/test-connection

## 🔐 Authentication

### Test Users
The system comes with pre-configured test users:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cod-crm.com | Admin123! |
| Call Center | agent@cod-crm.com | Agent123! |
| Fulfillment | fulfill@cod-crm.com | Fulfill123! |
| Marketing | marketing@cod-crm.com | Marketing123! |

### API Endpoints

#### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration (admin only)
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/me` - Update current user
- `POST /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/logout` - Logout

#### User Management (Admin only)
- `GET /api/v1/auth/users` - List all users
- `GET /api/v1/auth/users/{user_id}` - Get user by ID
- `PUT /api/v1/auth/users/{user_id}` - Update user by ID

## 🧪 Testing

### Test Authentication
```bash
# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@cod-crm.com", "password": "Admin123!"}'

# Get current user (replace TOKEN with actual token)
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer TOKEN"
```

### Test Frontend Connection
Visit http://localhost:3000/test-connection to verify the frontend-backend connection.

## 📚 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🗄️ Database

### Migrations
```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Database Schema
The system uses PostgreSQL with the following main tables:
- `users` - User accounts with roles and authentication
- Additional tables will be added as the system grows

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cod_crm
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🚀 Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy with a WSGI server like Gunicorn

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `out` directory to a static hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at http://localhost:8000/docs
- Review the test connection page at http://localhost:3000/test-connection

## 🎯 Roadmap

- [ ] Lead management system
- [ ] Order tracking
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Integration with payment gateways
- [ ] Multi-tenant support

---

**Built with ❤️ for efficient Cash-on-Delivery operations**