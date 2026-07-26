import { api } from './client';

export interface StockQuote {
  ticker: string;
  price: number;
  change_amount: number;
  change_percent: number;
  volume: number;
  last_updated: string;
  simulated: boolean;
}

export function getQuote(ticker: string) {
  return api.get<StockQuote>(`/api/quotes/${ticker}`);
}

export function getAllQuotes() {
  return api.get<{ quotes: StockQuote[] }>('/api/quotes');
}
