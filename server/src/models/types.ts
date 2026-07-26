// Shared TypeScript types for the server

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface Account {
  id: number;
  user_id: number;
  balance: number;
  starting_balance: number;
  created_at: string;
}

export interface PortfolioHolding {
  id: number;
  user_id: number;
  ticker: string;
  quantity: number;
  average_cost: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  ticker: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_amount: number;
  timestamp: string;
}

export interface StockQuote {
  ticker: string;
  price: number;
  change_amount: number;
  change_percent: number;
  volume: number;
  last_updated: string;
}

export interface Order {
  id: number;
  user_id: number;
  ticker: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  status: 'pending' | 'filled' | 'cancelled';
  created_at: string;
}

export interface JwtPayload {
  userId: number;
  username: string;
}
