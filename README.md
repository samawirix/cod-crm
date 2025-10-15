# COD CRM - Full Stack Application

Complete Cash-on-Delivery CRM system.

## Structure
- `backend/` - FastAPI Python backend
- `frontend/` - Next.js 14 TypeScript frontend
- `shared/` - Shared utilities

## Getting Started

### Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Test: http://localhost:3000/test-connection