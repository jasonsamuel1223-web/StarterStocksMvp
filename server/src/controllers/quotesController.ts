import { Request, Response } from 'express';
import db from '../database';
import { StockQuote } from '../models/types';

// Simulate minor price drift so quotes don't feel static (up to ±0.2% per call)
function simulatePriceDrift(price: number): number {
  const drift = (Math.random() - 0.5) * 0.004; // random in [-0.002, +0.002] → ±0.2%
  return Math.round(price * (1 + drift) * 100) / 100;
}

export function getQuote(req: Request, res: Response): void {
  try {
    const ticker = req.params.ticker.toUpperCase();

    const quote = db
      .prepare('SELECT * FROM stock_quotes WHERE ticker = ?')
      .get(ticker) as StockQuote | undefined;

    if (!quote) {
      res.status(404).json({ error: `Ticker ${ticker} not found` });
      return;
    }

    // Apply simulated drift to the price on each request
    const currentPrice = simulatePriceDrift(quote.price);

    res.json({
      ticker: quote.ticker,
      price: currentPrice,
      change_amount: quote.change_amount,
      change_percent: quote.change_percent,
      volume: quote.volume,
      last_updated: new Date().toISOString(),
      simulated: true,
    });
  } catch (err) {
    console.error('getQuote error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getAllQuotes(_req: Request, res: Response): void {
  try {
    const quotes = db.prepare('SELECT * FROM stock_quotes ORDER BY ticker').all() as StockQuote[];

    const enriched = quotes.map((q) => ({
      ...q,
      price: simulatePriceDrift(q.price),
      simulated: true,
    }));

    res.json({ quotes: enriched });
  } catch (err) {
    console.error('getAllQuotes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
