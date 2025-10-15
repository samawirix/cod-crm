import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  health: () => apiClient.get('/api/health'),
  test: () => apiClient.get('/api/v1/test'),
  login: (email: string, password: string) =>
    apiClient.post('/api/v1/auth/login', { email, password }),
  getCurrentUser: () => apiClient.get('/api/v1/auth/me'),
  getDashboard: (dateFrom?: string, dateTo?: string) =>
    apiClient.get('/api/v1/analytics/dashboard', {
      params: { date_from: dateFrom, date_to: dateTo },
    }),
  getLeads: (filters?: any) =>
    apiClient.get('/api/v1/leads', { params: filters }),
};

export default apiClient;
