export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'call_center' | 'fulfillment' | 'marketing';
  created_at: string;
}

export interface Lead {
  id: string;
  customer_name: string;
  phone: string;
  city: string;
  product_name: string;
  total_amount: number;
  status: 'new' | 'confirmed' | 'shipped' | 'delivered' | 'returned';
  created_at: string;
}

export interface DashboardData {
  total_leads: number;
  confirmed_orders: number;
  delivered_orders: number;
  returned_orders: number;
  confirmation_rate: number;
  delivery_rate: number;
  return_rate: number;
  net_profit: number;
  funnel: {
    new: number;
    confirmed: number;
    shipped: number;
    delivered: number;
  };
  recent_activity: Lead[];
}
