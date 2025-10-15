import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            COD CRM System
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Complete Cash-on-Delivery Customer Relationship Management System
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-900 p-8 rounded-lg border border-slate-800">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">Backend API</h2>
              <p className="text-gray-300 mb-6">
                FastAPI-powered backend with PostgreSQL database, authentication, and comprehensive API endpoints.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>• RESTful API with automatic documentation</p>
                <p>• JWT authentication & authorization</p>
                <p>• PostgreSQL database with SQLAlchemy ORM</p>
                <p>• CORS enabled for frontend integration</p>
              </div>
              <div className="mt-6">
                <a 
                  href="http://localhost:8000/docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
                >
                  View API Docs
                </a>
              </div>
            </div>
            
            <div className="bg-slate-900 p-8 rounded-lg border border-slate-800">
              <h2 className="text-2xl font-semibold mb-4 text-purple-400">Frontend Dashboard</h2>
              <p className="text-gray-300 mb-6">
                Modern Next.js 14 frontend with TypeScript, Tailwind CSS, and real-time data management.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>• Next.js 14 with App Router</p>
                <p>• TypeScript for type safety</p>
                <p>• Tailwind CSS for styling</p>
                <p>• React Query for data fetching</p>
              </div>
              <div className="mt-6">
                <Link 
                  href="/test-connection"
                  className="inline-block bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition-colors"
                >
                  Test Connection
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-16">
            <h3 className="text-2xl font-semibold mb-8">Quick Start</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-slate-800 p-6 rounded-lg">
                <h4 className="font-semibold mb-3 text-green-400">Backend Setup</h4>
                <pre className="text-sm text-gray-300 bg-slate-900 p-3 rounded overflow-x-auto">
{`cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload`}
                </pre>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg">
                <h4 className="font-semibold mb-3 text-green-400">Frontend Setup</h4>
                <pre className="text-sm text-gray-300 bg-slate-900 p-3 rounded overflow-x-auto">
{`cd frontend
npm install
npm run dev`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
