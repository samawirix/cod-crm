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

// ============ LEADS API ============

export interface Lead {
  id: number;
  first_name: string;
  last_name?: string;
  full_name?: string;
  phone: string;
  email?: string;
  company?: string;
  city?: string;
  address?: string;
  product_interest?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  source: string;
  status: string;
  lead_score: number;
  created_at: string;
  updated_at: string;
}

export interface LeadListResponse {
  leads: Lead[];
  total: number;
  page: number;
  page_size: number;
}

export async function getLeads(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  source?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<LeadListResponse> {
  const queryParams: any = { ...params };
  if (params?.startDate) queryParams.date_from = params.startDate;
  if (params?.endDate) queryParams.date_to = params.endDate;
  // Cleanup frontend-only params
  delete queryParams.startDate;
  delete queryParams.endDate;

  const response = await apiClient.get('/api/v1/leads/', { params: queryParams });
  return response.data;
}

export async function getLead(leadId: number): Promise<Lead> {
  const response = await apiClient.get(`/api/v1/leads/${leadId}`);
  return response.data;
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  const response = await apiClient.post('/api/v1/leads/', data);
  return response.data;
}

export async function updateLead(leadId: number, data: Partial<Lead>): Promise<Lead> {
  const response = await apiClient.put(`/api/v1/leads/${leadId}`, data);
  return response.data;
}

export async function deleteLead(leadId: number): Promise<void> {
  await apiClient.delete(`/api/v1/leads/${leadId}`);
}

// Analytics API functions
export async function getDashboardStats(startDate?: string, endDate?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.date_from = startDate.split('T')[0];
  if (endDate) params.date_to = endDate.split('T')[0];

  const response = await apiClient.get('/api/v1/analytics/dashboard', { params });
  return response.data;
}

export async function getLeadsByDay(startDate?: string, endDate?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await apiClient.get('/api/v1/analytics/leads-by-day', { params });
  return response.data;
}

export async function getLeadsBySource(startDate?: string, endDate?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await apiClient.get('/api/v1/analytics/leads-by-source', { params });
  return response.data;
}

export async function getAgentPerformance(startDate?: string, endDate?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await apiClient.get('/api/v1/analytics/agent-performance', { params });
  return response.data;
}

export async function getConversionFunnel(startDate?: string, endDate?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await apiClient.get('/api/v1/analytics/conversion-funnel', { params });
  return response.data;
}

export async function getCallStatistics(startDate?: string, endDate?: string, userId?: number) {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (userId) params.user_id = userId.toString();

  const response = await apiClient.get('/api/v1/analytics/call-statistics', { params });
  return response.data;
}

// ============ ORDER TYPES ============

export interface Order {
  id: number;
  order_number: string;
  lead_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  city: string;
  postal_code?: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  delivery_charges: number;
  total_amount: number;
  status: string;
  payment_status: string;
  is_confirmed: boolean;
  confirmed_by?: string;
  confirmed_at?: string;
  courier?: string;
  courier_tracking_url?: string;
  tracking_number?: string;
  delivery_partner?: string;
  delivery_attempts: number;
  shipped_at?: string;
  delivered_at?: string;
  delivery_failed: boolean;
  failure_reason?: string;
  payment_collected: boolean;
  cash_collected?: number;
  is_returned: boolean;
  return_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  per_page: number;
}

export interface OrderStats {
  total_orders: number;
  by_status: {
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    returned: number;
    cancelled: number;
    failed: number;
  };
  rates: {
    delivery_rate: number;
    return_rate: number;
    cancellation_rate: number;
  };
  revenue: {
    total_revenue: number;
    collected_amount: number;
    pending_collection: number;
  };
}

export interface CreateOrderData {
  lead_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  city: string;
  postal_code?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  delivery_charges?: number;
  notes?: string;
}

// ============ ORDER API FUNCTIONS ============

export async function getOrders(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  payment_status?: string;
  search?: string;
}): Promise<OrderListResponse> {
  const response = await apiClient.get('/api/v1/orders/', { params });
  return response.data;
}

export async function getOrder(orderId: number): Promise<Order> {
  const response = await apiClient.get(`/api/v1/orders/${orderId}`);
  return response.data;
}

export async function getOrderStats(): Promise<OrderStats> {
  const response = await apiClient.get('/api/v1/orders/stats/summary');
  return response.data;
}

export async function createOrder(data: CreateOrderData): Promise<Order> {
  const response = await apiClient.post('/api/v1/orders/', data);
  return response.data;
}

export async function confirmOrder(orderId: number, data: { confirmed_by: string; notes?: string }): Promise<Order> {
  const response = await apiClient.post(`/api/v1/orders/${orderId}/confirm`, data);
  return response.data;
}

export async function shipOrder(orderId: number, data: { tracking_number: string; delivery_partner: string }): Promise<Order> {
  const response = await apiClient.post(`/api/v1/orders/${orderId}/ship`, data);
  return response.data;
}

export async function markOutForDelivery(orderId: number): Promise<Order> {
  const response = await apiClient.post(`/api/v1/orders/${orderId}/out-for-delivery`);
  return response.data;
}

export async function deliverOrder(orderId: number, data: { success: boolean; cash_collected?: number; failure_reason?: string }): Promise<Order> {
  const response = await apiClient.post(`/api/v1/orders/${orderId}/deliver`, data);
  return response.data;
}

export async function returnOrder(orderId: number, data: { return_reason: string; notes?: string }): Promise<Order> {
  const response = await apiClient.post(`/api/v1/orders/${orderId}/return`, data);
  return response.data;
}

export async function cancelOrder(orderId: number, reason: string, cancelled_by: string): Promise<Order> {
  const response = await apiClient.post(`/api/v1/orders/${orderId}/cancel`, null, {
    params: { reason, cancelled_by }
  });
  return response.data;
}

export async function getOrderHistory(orderId: number) {
  const response = await apiClient.get(`/api/v1/orders/${orderId}/history`);
  return response.data;
}

// ============ PRODUCT/INVENTORY API ============

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  short_description?: string;
  category_id?: number;
  category_name?: string;
  cost_price: number;
  selling_price: number;
  compare_at_price?: number;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  weight?: number;
  dimensions?: string;
  image_url?: string;
  is_active: boolean;
  is_featured: boolean;
  tags?: string;
  total_sold: number;
  total_revenue: number;
  profit_margin: number;
  profit_per_unit: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  stock_value: number;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface InventoryStats {
  total_products: number;
  active_products: number;
  out_of_stock: number;
  low_stock: number;
  total_stock_value: number;
  total_retail_value: number;
  potential_profit: number;
  categories_count: number;
}

export interface StockMovement {
  id: number;
  product_id: number;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_at: string;
}

export interface CreateProductData {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  short_description?: string;
  category_id?: number;
  cost_price: number;
  selling_price: number;
  compare_at_price?: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  track_inventory?: boolean;
  allow_backorder?: boolean;
  weight?: number;
  dimensions?: string;
  image_url?: string;
  is_active?: boolean;
  is_featured?: boolean;
  tags?: string;
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get('/api/v1/products/categories');
  return response.data;
}

export async function createCategory(data: { name: string; description?: string; parent_id?: number }): Promise<Category> {
  const response = await apiClient.post('/api/v1/products/categories', data);
  return response.data;
}

// Products
export async function getProducts(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  category_id?: number;
  is_active?: boolean;
  is_featured?: boolean;
  low_stock_only?: boolean;
  out_of_stock_only?: boolean;
  sort_by?: string;
  sort_order?: string;
}): Promise<ProductListResponse> {
  const response = await apiClient.get('/api/v1/products/', { params });
  return response.data;
}

export async function getProduct(productId: number): Promise<Product> {
  const response = await apiClient.get(`/api/v1/products/${productId}`);
  return response.data;
}

export async function getInventoryStats(): Promise<InventoryStats> {
  const response = await apiClient.get('/api/v1/products/stats');
  return response.data;
}

export async function getLowStockProducts(limit: number = 10): Promise<ProductListResponse> {
  const response = await apiClient.get('/api/v1/products/low-stock', { params: { limit } });
  return response.data;
}

export async function getTopSellingProducts(limit: number = 10): Promise<ProductListResponse> {
  const response = await apiClient.get('/api/v1/products/top-selling', { params: { limit } });
  return response.data;
}

export async function createProduct(data: CreateProductData): Promise<Product> {
  const response = await apiClient.post('/api/v1/products/', data);
  return response.data;
}

export async function updateProduct(productId: number, data: Partial<CreateProductData>): Promise<Product> {
  const response = await apiClient.put(`/api/v1/products/${productId}`, data);
  return response.data;
}

export async function deleteProduct(productId: number): Promise<void> {
  await apiClient.delete(`/api/v1/products/${productId}`);
}

export async function adjustStock(productId: number, data: { quantity: number; reason: string; notes?: string }): Promise<Product> {
  const response = await apiClient.post(`/api/v1/products/${productId}/adjust-stock`, data);
  return response.data;
}

export async function getStockMovements(productId: number, limit: number = 50): Promise<StockMovement[]> {
  const response = await apiClient.get(`/api/v1/products/${productId}/stock-movements`, { params: { limit } });
  return response.data;
}


// ============ ORDER ITEMS API ============

export interface OrderItemCreate {
  product_id: number;
  quantity: number;
  discount?: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  unit_price: number;
  cost_price: number;
  quantity: number;
  subtotal: number;
  discount: number;
  total: number;
}

export interface CreateOrderWithItemsData {
  lead_id: number;
  items: OrderItemCreate[];
  shipping_cost: number;
  discount: number;
  shipping_address: string;
  shipping_city: string;
  shipping_region?: string;
  shipping_postal_code?: string;
  order_notes?: string;
}

export async function getAvailableProducts(search?: string, category_id?: number) {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (category_id) params.category_id = category_id.toString();

  const response = await apiClient.get('/api/v1/orders/products/available', { params });
  return response.data;
}

export async function createOrderWithItems(data: CreateOrderWithItemsData) {
  const response = await apiClient.post('/api/v1/orders/with-items', data);
  return response.data;
}

export async function getOrderItems(orderId: number): Promise<OrderItem[]> {
  const response = await apiClient.get(`/api/v1/orders/${orderId}/items`);
  return response.data;
}


// ============ FINANCIAL API ============

export interface FinancialSummary {
  period: {
    start_date: string;
    end_date: string;
  };
  revenue: {
    total_revenue: number;
    shipping_revenue: number;
    pending_revenue: number;
    returned_amount: number;
    cancelled_amount: number;
  };
  costs: {
    total_cost: number;
    cogs: number;
  };
  profit: {
    gross_profit: number;
    gross_margin: number;
    net_profit: number;
  };
  orders: {
    total_orders: number;
    delivered_orders: number;
    pending_orders: number;
    returned_orders: number;
    cancelled_orders: number;
    avg_order_value: number;
  };
  collection: {
    collected_amount: number;
    pending_collection: number;
    collection_rate: number;
  };
  ad_spend?: {
    total_ad_spend: number;
    net_profit: number;
    net_margin: number;
    roas: number;
  };
}

export interface RevenueByDay {
  date: string;
  orders: number;
  revenue: number;
  returned: number;
}

export interface RevenueByProduct {
  product_name: string;
  product_sku: string;
  quantity_sold: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface RevenueByCity {
  city: string;
  orders: number;
  revenue: number;
}

export interface MonthlyComparison {
  month: string;
  start_date: string;
  orders: number;
  revenue: number;
}

export interface ProfitAnalysis {
  summary: {
    total_revenue: number;
    total_cost: number;
    gross_profit: number;
    shipping_collected: number;
    discounts_given: number;
    gross_margin: number;
  };
  top_profitable_products: Array<{
    name: string;
    revenue: number;
    cost: number;
    profit: number;
    units: number;
  }>;
  least_profitable_products: Array<{
    name: string;
    revenue: number;
    cost: number;
    profit: number;
    units: number;
  }>;
}

export async function getFinancialSummary(startDate?: string, endDate?: string): Promise<FinancialSummary> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await apiClient.get('/api/v1/financial/summary', { params });
  return response.data;
}

export async function getRevenueByDay(startDate?: string, endDate?: string): Promise<RevenueByDay[]> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await apiClient.get('/api/v1/financial/revenue-by-day', { params });
  return response.data;
}

export async function getRevenueByProduct(startDate?: string, endDate?: string, limit: number = 10): Promise<RevenueByProduct[]> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  params.limit = limit.toString();

  const response = await apiClient.get('/api/v1/financial/revenue-by-product', { params });
  return response.data;
}

export async function getRevenueByCity(startDate?: string, endDate?: string, limit: number = 10): Promise<RevenueByCity[]> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  params.limit = limit.toString();

  const response = await apiClient.get('/api/v1/financial/revenue-by-city', { params });
  return response.data;
}

export async function getMonthlyComparison(months: number = 6): Promise<MonthlyComparison[]> {
  const response = await apiClient.get('/api/v1/financial/monthly-comparison', { params: { months } });
  return response.data;
}

export async function getProfitAnalysis(startDate?: string, endDate?: string): Promise<ProfitAnalysis> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await apiClient.get('/api/v1/financial/profit-analysis', { params });
  return response.data;
}


// ============ USER MANAGEMENT API ============

export type UserRole = 'admin' | 'manager' | 'agent' | 'fulfillment' | 'viewer';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  leads_assigned: number;
  leads_converted: number;
  calls_made: number;
  orders_created: number;
  conversion_rate: number;
  created_at: string;
  last_login?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserData {
  email?: string;
  full_name?: string;
  phone?: string;
  role?: UserRole;
  is_active?: boolean;
  avatar_url?: string;
}

export interface UserPerformance {
  user_id: number;
  user_name: string;
  role: string;
  leads: {
    total: number;
    converted: number;
    conversion_rate: number;
  };
  calls: {
    total: number;
    answered: number;
    contact_rate: number;
  };
  orders: {
    total: number;
    delivered: number;
    revenue: number;
  };
}

export async function getUsers(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  role?: string;
  is_active?: boolean;
}): Promise<UserListResponse> {
  const response = await apiClient.get('/api/v1/users/', { params });
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get('/api/v1/users/me');
  return response.data;
}

export async function getAgents(): Promise<{ agents: Array<{ id: number; name: string; email: string; role: string }> }> {
  const response = await apiClient.get('/api/v1/users/agents');
  return response.data;
}

export async function getUserById(userId: number): Promise<User> {
  const response = await apiClient.get(`/api/v1/users/${userId}`);
  return response.data;
}

export async function getUserPerformance(userId: number): Promise<UserPerformance> {
  const response = await apiClient.get(`/api/v1/users/${userId}/performance`);
  return response.data;
}

export async function createUser(data: CreateUserData): Promise<User> {
  const response = await apiClient.post('/api/v1/users/', data);
  return response.data;
}

export async function updateUser(userId: number, data: UpdateUserData): Promise<User> {
  const response = await apiClient.put(`/api/v1/users/${userId}`, data);
  return response.data;
}

export async function activateUser(userId: number): Promise<User> {
  const response = await apiClient.post(`/api/v1/users/${userId}/activate`);
  return response.data;
}

export async function deactivateUser(userId: number): Promise<User> {
  const response = await apiClient.post(`/api/v1/users/${userId}/deactivate`);
  return response.data;
}

export async function resetUserPassword(userId: number, newPassword: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/api/v1/users/${userId}/reset-password?new_password=${encodeURIComponent(newPassword)}`);
  return response.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const response = await apiClient.post('/api/v1/users/me/change-password', {
    current_password: currentPassword,
    new_password: newPassword
  });
  return response.data;
}

export default apiClient;

