# COD CRM Frontend

Next.js 14 frontend for the COD CRM system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create .env.local file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run the development server:
```bash
npm run dev
```

## Features

- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Axios for API calls
- React Query for data fetching
- Zustand for state management
- Lucide React for icons

## Pages

- `/` - Home page with project overview
- `/test-connection` - API connection test page

## API Integration

The frontend connects to the FastAPI backend running on `http://localhost:8000` by default.

## Development

- Development server: http://localhost:3000
- API documentation: http://localhost:8000/docs