import { Response } from 'express';
import db from '../database';
import { AuthRequest } from '../middleware/auth';
import { StockQuote, PortfolioHolding, Order, Account } from '../models/types';

export function buyStock(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const { ticker, quantity } = req.body as { ticker?: string; quantity?: number };

    if (!ticker || !quantity) {
      res.status(400).json({ error: 'ticker and quantity are required' });
      return;
    }
    if (quantity <= 0 || !Number.isFinite(quantity)) {
      res.status(400).json({ error: 'quantity must be a positive number' });
      return;
    }

    const upperTicker = ticker.toUpperCase();

    const quote = db
      .prepare('SELECT * FROM stock_quotes WHERE ticker = ?')
      .get(upperTicker) as StockQuote | undefined;

    if (!quote) {
      res.status(404).json({ error: `Ticker ${upperTicker} not found` });
      return;
    }

    const price = quote.price;
    const totalCost = price * quantity;

    const account = db
      .prepare('SELECT * FROM accounts WHERE user_id = ?')
      .get(userId) as Account | undefined;

    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }
    if (account.balance < totalCost) {
      res.status(400).json({
        error: 'Insufficient funds',
        required: totalCost,
        available: account.balance,
      });
      return;
    }

    const executeTrade = db.transaction(() => {
      // Deduct cash
      db.prepare('UPDATE accounts SET balance = balance - ? WHERE user_id = ?').run(
        totalCost,
        userId
      );

      // Update portfolio holding
      const existing = db
        .prepare('SELECT * FROM portfolio WHERE user_id = ? AND ticker = ?')
        .get(userId, upperTicker) as PortfolioHolding | undefined;

      if (existing) {
        const newQty = existing.quantity + quantity;
        const newAvgCost =
          (existing.average_cost * existing.quantity + price * quantity) / newQty;
        db.prepare(
          `UPDATE portfolio SET quantity = ?, average_cost = ?, updated_at = datetime('now')
           WHERE user_id = ? AND ticker = ?`
        ).run(newQty, newAvgCost, userId, upperTicker);
      } else {
        db.prepare(
          `INSERT INTO portfolio (user_id, ticker, quantity, average_cost)
           VALUES (?, ?, ?, ?)`
        ).run(userId, upperTicker, quantity, price);
      }

      // Record transaction
      db.prepare(
        `INSERT INTO transactions (user_id, ticker, type, quantity, price, total_amount)
         VALUES (?, ?, 'buy', ?, ?, ?)`
      ).run(userId, upperTicker, quantity, price, totalCost);

      // Create filled order record
      const orderResult = db.prepare(
        `INSERT INTO orders (user_id, ticker, type, quantity, price, status)
         VALUES (?, ?, 'buy', ?, ?, 'filled')`
      ).run(userId, upperTicker, quantity, price);

      return orderResult.lastInsertRowid;
    });

    const orderId = executeTrade();

    const updatedAccount = db
      .prepare('SELECT balance FROM accounts WHERE user_id = ?')
      .get(userId) as { balance: number };

    res.status(201).json({
      message: 'Buy order filled',
      order_id: orderId,
      ticker: upperTicker,
      quantity,
      price,
      total_cost: totalCost,
      new_balance: updatedAccount.balance,
    });
  } catch (err) {
    console.error('buyStock error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function sellStock(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const { ticker, quantity } = req.body as { ticker?: string; quantity?: number };

    if (!ticker || !quantity) {
      res.status(400).json({ error: 'ticker and quantity are required' });
      return;
    }
    if (quantity <= 0 || !Number.isFinite(quantity)) {
      res.status(400).json({ error: 'quantity must be a positive number' });
      return;
    }

    const upperTicker = ticker.toUpperCase();

    const quote = db
      .prepare('SELECT * FROM stock_quotes WHERE ticker = ?')
      .get(upperTicker) as StockQuote | undefined;

    if (!quote) {
      res.status(404).json({ error: `Ticker ${upperTicker} not found` });
      return;
    }

    const holding = db
      .prepare('SELECT * FROM portfolio WHERE user_id = ? AND ticker = ?')
      .get(userId, upperTicker) as PortfolioHolding | undefined;

    if (!holding || holding.quantity < quantity) {
      res.status(400).json({
        error: 'Insufficient shares',
        owned: holding?.quantity ?? 0,
        requested: quantity,
      });
      return;
    }

    const price = quote.price;
    const totalProceeds = price * quantity;

    const executeSell = db.transaction(() => {
      // Add cash
      db.prepare('UPDATE accounts SET balance = balance + ? WHERE user_id = ?').run(
        totalProceeds,
        userId
      );

      // Update holding
      const newQty = holding.quantity - quantity;
      if (newQty === 0) {
        db.prepare('DELETE FROM portfolio WHERE user_id = ? AND ticker = ?').run(
          userId,
          upperTicker
        );
      } else {
        db.prepare(
          `UPDATE portfolio SET quantity = ?, updated_at = datetime('now')
           WHERE user_id = ? AND ticker = ?`
        ).run(newQty, userId, upperTicker);
      }

      // Record transaction
      db.prepare(
        `INSERT INTO transactions (user_id, ticker, type, quantity, price, total_amount)
         VALUES (?, ?, 'sell', ?, ?, ?)`
      ).run(userId, upperTicker, quantity, price, totalProceeds);

      // Create filled order record
      const orderResult = db.prepare(
        `INSERT INTO orders (user_id, ticker, type, quantity, price, status)
         VALUES (?, ?, 'sell', ?, ?, 'filled')`
      ).run(userId, upperTicker, quantity, price);

      return orderResult.lastInsertRowid;
    });

    const orderId = executeSell();

    const updatedAccount = db
      .prepare('SELECT balance FROM accounts WHERE user_id = ?')
      .get(userId) as { balance: number };

    res.status(201).json({
      message: 'Sell order filled',
      order_id: orderId,
      ticker: upperTicker,
      quantity,
      price,
      total_proceeds: totalProceeds,
      new_balance: updatedAccount.balance,
    });
  } catch (err) {
    console.error('sellStock error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getOrders(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const orders = db
      .prepare(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .all(userId, limit, offset) as Order[];

    res.json({ orders, limit, offset });
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getOrderById(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const order = db
      .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
      .get(orderId, userId) as Order | undefined;

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ order });
  } catch (err) {
    console.error('getOrderById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
