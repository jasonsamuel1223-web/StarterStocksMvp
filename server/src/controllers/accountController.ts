import { Response } from 'express';
import db from '../database';
import { AuthRequest } from '../middleware/auth';
import { Account, PortfolioHolding, Transaction, StockQuote } from '../models/types';

export function getBalance(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const account = db
      .prepare('SELECT * FROM accounts WHERE user_id = ?')
      .get(userId) as Account | undefined;

    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    res.json({
      cash_balance: account.balance,
      starting_balance: account.starting_balance,
    });
  } catch (err) {
    console.error('getBalance error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getPortfolio(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const holdings = db
      .prepare('SELECT * FROM portfolio WHERE user_id = ? AND quantity > 0')
      .all(userId) as PortfolioHolding[];

    // Enrich with current prices
    const enriched = holdings.map((h) => {
      const quote = db
        .prepare('SELECT price FROM stock_quotes WHERE ticker = ?')
        .get(h.ticker) as { price: number } | undefined;
      const currentPrice = quote?.price ?? h.average_cost;
      const currentValue = currentPrice * h.quantity;
      const costBasis = h.average_cost * h.quantity;
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
      return {
        ...h,
        current_price: currentPrice,
        current_value: currentValue,
        cost_basis: costBasis,
        gain_loss: gainLoss,
        gain_loss_percent: gainLossPercent,
      };
    });

    res.json({ holdings: enriched });
  } catch (err) {
    console.error('getPortfolio error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getTransactions(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const transactions = db
      .prepare(
        'SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC, id DESC LIMIT ? OFFSET ?'
      )
      .all(userId, limit, offset) as Transaction[];

    res.json({ transactions, limit, offset });
  } catch (err) {
    console.error('getTransactions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getAccountInfo(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;

    const user = db
      .prepare('SELECT id, username, email, created_at FROM users WHERE id = ?')
      .get(userId) as { id: number; username: string; email: string; created_at: string } | undefined;

    const account = db
      .prepare('SELECT * FROM accounts WHERE user_id = ?')
      .get(userId) as Account | undefined;

    if (!user || !account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    // Calculate portfolio value
    const holdings = db
      .prepare('SELECT ticker, quantity, average_cost FROM portfolio WHERE user_id = ? AND quantity > 0')
      .all(userId) as { ticker: string; quantity: number; average_cost: number }[];

    let portfolioValue = 0;
    for (const h of holdings) {
      const quote = db
        .prepare('SELECT price FROM stock_quotes WHERE ticker = ?')
        .get(h.ticker) as { price: number } | undefined;
      portfolioValue += (quote?.price ?? h.average_cost) * h.quantity;
    }

    const totalValue = account.balance + portfolioValue;
    const totalGainLoss = totalValue - account.starting_balance;
    const totalGainLossPercent =
      account.starting_balance > 0 ? (totalGainLoss / account.starting_balance) * 100 : 0;

    res.json({
      user,
      account: {
        id: account.id,
        cash_balance: account.balance,
        portfolio_value: portfolioValue,
        total_value: totalValue,
        starting_balance: account.starting_balance,
        total_gain_loss: totalGainLoss,
        total_gain_loss_percent: totalGainLossPercent,
        created_at: account.created_at,
      },
    });
  } catch (err) {
    console.error('getAccountInfo error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
