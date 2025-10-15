'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function TestConnectionPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.test();
      setResult(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">
          API Connection Test
        </h1>
        <p className="text-gray-400 mb-8">
          Test the connection between frontend and backend
        </p>

        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
          <button
            onClick={testConnection}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
              loading
                ? 'bg-blue-500/50 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            {loading ? 'Testing Connection...' : 'Test Backend Connection'}
          </button>

          {result && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-500 font-semibold">
                  Connected Successfully!
                </span>
              </div>
              <pre className="bg-slate-950 p-4 rounded border border-slate-800 overflow-x-auto">
                <code className="text-sm text-gray-300">
                  {JSON.stringify(result, null, 2)}
                </code>
              </pre>
            </div>
          )}

          {error && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-red-500 font-semibold">
                  Connection Failed
                </span>
              </div>
              <div className="bg-red-500/10 border border-red-500/50 rounded p-4">
                <p className="text-red-400 text-sm">{error}</p>
                <p className="text-gray-400 text-xs mt-2">
                  Make sure the backend is running on http://localhost:8000
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800">
            <h3 className="text-white font-semibold mb-3">Backend Status:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">API URL:</span>
                <span className="text-gray-300 font-mono">
                  http://localhost:8000
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Frontend URL:</span>
                <span className="text-gray-300 font-mono">
                  http://localhost:3000
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
