import { Response } from 'express';
import db from '../database';
import { AuthRequest } from '../middleware/auth';
import { PortfolioHolding, Account, Transaction, StockQuote } from '../models/types';

export function getHoldings(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const holdings = db
      .prepare('SELECT * FROM portfolio WHERE user_id = ? AND quantity > 0 ORDER BY ticker')
      .all(userId) as PortfolioHolding[];

    const enriched = holdings.map((h) => {
      const quote = db
        .prepare('SELECT price FROM stock_quotes WHERE ticker = ?')
        .get(h.ticker) as { price: number } | undefined;
      const currentPrice = quote?.price ?? h.average_cost;
      const currentValue = currentPrice * h.quantity;
      const costBasis = h.average_cost * h.quantity;
      return {
        ...h,
        current_price: currentPrice,
        current_value: currentValue,
        cost_basis: costBasis,
        gain_loss: currentValue - costBasis,
        gain_loss_percent: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0,
      };
    });

    res.json({ holdings: enriched });
  } catch (err) {
    console.error('getHoldings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getPerformance(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;

    const account = db
      .prepare('SELECT * FROM accounts WHERE user_id = ?')
      .get(userId) as Account | undefined;

    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const holdings = db
      .prepare('SELECT ticker, quantity, average_cost FROM portfolio WHERE user_id = ? AND quantity > 0')
      .all(userId) as { ticker: string; quantity: number; average_cost: number }[];

    let portfolioValue = 0;
    let totalCostBasis = 0;

    const holdingsPerformance = holdings.map((h) => {
      const quote = db
        .prepare('SELECT price FROM stock_quotes WHERE ticker = ?')
        .get(h.ticker) as { price: number } | undefined;
      const currentPrice = quote?.price ?? h.average_cost;
      const currentValue = currentPrice * h.quantity;
      const costBasis = h.average_cost * h.quantity;
      portfolioValue += currentValue;
      totalCostBasis += costBasis;
      return {
        ticker: h.ticker,
        current_price: currentPrice,
        quantity: h.quantity,
        average_cost: h.average_cost,
        current_value: currentValue,
        cost_basis: costBasis,
        gain_loss: currentValue - costBasis,
        gain_loss_percent: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0,
      };
    });

    const totalValue = account.balance + portfolioValue;
    const overallGainLoss = totalValue - account.starting_balance;
    const overallGainLossPercent =
      account.starting_balance > 0 ? (overallGainLoss / account.starting_balance) * 100 : 0;

    res.json({
      cash_balance: account.balance,
      portfolio_value: portfolioValue,
      total_value: totalValue,
      starting_balance: account.starting_balance,
      overall_gain_loss: overallGainLoss,
      overall_gain_loss_percent: overallGainLossPercent,
      cost_basis: totalCostBasis,
      unrealized_gain_loss: portfolioValue - totalCostBasis,
      holdings: holdingsPerformance,
    });
  } catch (err) {
    console.error('getPerformance error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getSummary(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;

    const account = db
      .prepare('SELECT balance, starting_balance FROM accounts WHERE user_id = ?')
      .get(userId) as { balance: number; starting_balance: number } | undefined;

    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const holdingsCount = (
      db
        .prepare('SELECT COUNT(*) as cnt FROM portfolio WHERE user_id = ? AND quantity > 0')
        .get(userId) as { cnt: number }
    ).cnt;

    const transactionCount = (
      db
        .prepare('SELECT COUNT(*) as cnt FROM transactions WHERE user_id = ?')
        .get(userId) as { cnt: number }
    ).cnt;

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

    res.json({
      cash_balance: account.balance,
      portfolio_value: portfolioValue,
      total_value: totalValue,
      starting_balance: account.starting_balance,
      total_gain_loss: totalGainLoss,
      holdings_count: holdingsCount,
      transaction_count: transactionCount,
    });
  } catch (err) {
    console.error('getSummary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
