import { api } from './client';

export interface Order {
  id: number;
  ticker: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  status: 'pending' | 'filled' | 'cancelled';
  created_at: string;
}

export interface TradeResult {
  message: string;
  order_id: number;
  ticker: string;
  quantity: number;
  price: number;
  total_cost?: number;
  total_proceeds?: number;
  new_balance: number;
}

export function buyStock(ticker: string, quantity: number) {
  return api.post<TradeResult>('/api/trades/buy', { ticker, quantity });
}

export function sellStock(ticker: string, quantity: number) {
  return api.post<TradeResult>('/api/trades/sell', { ticker, quantity });
}

export function getOrders(limit = 50) {
  return api.get<{ orders: Order[] }>(`/api/trades/orders?limit=${limit}`);
}

export function getOrder(id: number) {
  return api.get<{ order: Order }>(`/api/trades/orders/${id}`);
}
