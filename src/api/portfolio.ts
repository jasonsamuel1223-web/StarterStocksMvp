import { api } from './client';

export interface Holding {
  id: number;
  ticker: string;
  quantity: number;
  average_cost: number;
  current_price: number;
  current_value: number;
  cost_basis: number;
  gain_loss: number;
  gain_loss_percent: number;
  updated_at: string;
}

export interface PortfolioSummary {
  cash_balance: number;
  portfolio_value: number;
  total_value: number;
  starting_balance: number;
  total_gain_loss: number;
  holdings_count: number;
  transaction_count: number;
}

export interface PortfolioPerformance {
  cash_balance: number;
  portfolio_value: number;
  total_value: number;
  starting_balance: number;
  overall_gain_loss: number;
  overall_gain_loss_percent: number;
  cost_basis: number;
  unrealized_gain_loss: number;
  holdings: Holding[];
}

export function getHoldings() {
  return api.get<{ holdings: Holding[] }>('/api/portfolio/holdings');
}

export function getPerformance() {
  return api.get<PortfolioPerformance>('/api/portfolio/performance');
}

export function getSummary() {
  return api.get<PortfolioSummary>('/api/portfolio/summary');
}
