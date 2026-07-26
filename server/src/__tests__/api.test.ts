/**
 * Comprehensive test suite for StarterStocks paper-trading API.
 *
 * All financial values use integer cents:
 *   - Starting balance: 100000 (= $1,000.00)
 *   - AAPL price:       18950  (= $189.50)
 *   - INTC price:       4320   (= $43.20)
 */

// ── Mock the database module with an in-memory SQLite before any other imports ──
jest.mock('../database', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      balance INTEGER NOT NULL DEFAULT 100000,
      starting_balance INTEGER NOT NULL DEFAULT 100000,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ticker TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      average_cost INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, ticker)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ticker TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('buy', 'sell')),
      quantity REAL NOT NULL,
      price INTEGER NOT NULL,
      total_amount INTEGER NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stock_quotes (
      ticker TEXT PRIMARY KEY,
      price INTEGER NOT NULL,
      change_amount INTEGER NOT NULL DEFAULT 0,
      change_percent REAL NOT NULL DEFAULT 0,
      volume INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ticker TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('buy', 'sell')),
      quantity REAL NOT NULL,
      price INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'filled', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed stock quotes (integer cents)
  db.prepare(`
    INSERT INTO stock_quotes (ticker, price, change_amount, change_percent, volume)
    VALUES
      ('AAPL', 18950, 230, 1.23, 55000000),
      ('MSFT', 41520, -180, -0.43, 22000000),
      ('INTC', 4320,  -60, -1.37, 28000000),
      ('NVDA', 87540, 2260, 2.65, 45000000)
  `).run();

  return {
    __esModule: true,
    default: db,
    initializeDatabase: jest.fn(),
  };
});

import request from 'supertest';
import db from '../database';
import { createApp } from '../app';
import type { Application } from 'express';

// Set env vars for JWT before the app modules load
process.env.JWT_SECRET = 'test-jwt-secret-12345';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-67890';
process.env.NODE_ENV = 'test';

// ── Test helpers ──────────────────────────────────────────────────────────────

let app: Application;

/** Helper: register a user and return the access token + cookie. */
async function registerUser(
  username: string,
  email: string,
  password: string
): Promise<{ token: string; cookie: string }> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, email, password });
  return {
    token: res.body.token as string,
    cookie: ((res.headers['set-cookie'] as unknown) as string[] | undefined)?.[0] ?? '',
  };
}

/** Helper: login and return the access token. */
async function loginUser(
  email: string,
  password: string
): Promise<{ token: string; cookie: string }> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return {
    token: res.body.token as string,
    cookie: ((res.headers['set-cookie'] as unknown) as string[] | undefined)?.[0] ?? '',
  };
}

/** Helper: wipe all user data between tests. */
function clearUserData(): void {
  (db as import('better-sqlite3').Database).exec(
    'DELETE FROM orders; DELETE FROM transactions; DELETE FROM portfolio; DELETE FROM accounts; DELETE FROM users;'
  );
}

// ── Suite setup ───────────────────────────────────────────────────────────────

beforeAll(() => {
  app = createApp();
});

afterEach(() => {
  clearUserData();
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. REGISTRATION TESTS
// ═════════════════════════════════════════════════════════════════════════════

describe('Registration', () => {
  it('registers successfully with valid credentials', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'alice',
      email: 'alice@example.com',
      password: 'secret123',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ username: 'alice', email: 'alice@example.com' });
  });

  it('sets an HttpOnly refresh-token cookie on registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'bob',
      email: 'bob@example.com',
      password: 'password1',
    });

    expect(res.status).toBe(201);
    const cookies = ((res.headers['set-cookie'] as unknown) as string[] | undefined);
    expect(cookies).toBeDefined();
    const refreshCookie = cookies!.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toMatch(/HttpOnly/i);
    // The refresh token must NOT be in the response body
    expect(res.body).not.toHaveProperty('refreshToken');
  });

  it('initialises new account with 100000 cents (= $1,000)', async () => {
    const { token } = await registerUser('carol', 'carol@example.com', 'pw1234');

    const res = await request(app)
      .get('/api/account/balance')
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    expect(res.body.cash_balance).toBe(100000);
    expect(res.body.starting_balance).toBe(100000);
  });

  it('fails registration with duplicate email', async () => {
    await registerUser('dave1', 'dave@example.com', 'pw1234');

    const res = await request(app).post('/api/auth/register').send({
      username: 'dave2',
      email: 'dave@example.com',
      password: 'pw1234',
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('fails registration with invalid email (no @)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'eve',
      email: 'not-an-email',
      password: 'pw1234',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('fails registration with a weak password (< 6 characters)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'frank',
      email: 'frank@example.com',
      password: 'pw',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. LOGIN TESTS
// ═════════════════════════════════════════════════════════════════════════════

describe('Login', () => {
  it('returns access token and sets refresh cookie on successful login', async () => {
    await registerUser('grace', 'grace@example.com', 'password1');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'grace@example.com', password: 'password1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).not.toHaveProperty('refreshToken'); // cookie only

    const cookies = ((res.headers['set-cookie'] as unknown) as string[] | undefined);
    expect(cookies?.some((c) => c.startsWith('refreshToken='))).toBe(true);
  });

  it('fails with wrong password', async () => {
    await registerUser('henry', 'henry@example.com', 'correctpw');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'henry@example.com', password: 'wrongpw' });

    expect(res.status).toBe(401);
  });

  it('fails with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'pw1234' });

    expect(res.status).toBe(401);
  });

  it('access token can be used to reach a protected route', async () => {
    const { token } = await registerUser('iris', 'iris@example.com', 'pw1234');

    const res = await request(app)
      .get('/api/account/balance')
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
  });

  it('refresh endpoint rotates the cookie and returns a new access token', async () => {
    const { cookie } = await registerUser('jack', 'jack@example.com', 'pw1234');

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');

    const newCookies = ((res.headers['set-cookie'] as unknown) as string[] | undefined);
    expect(newCookies?.some((c) => c.startsWith('refreshToken='))).toBe(true);
  });

  it('logout clears the refresh cookie', async () => {
    const { cookie } = await registerUser('kate', 'kate@example.com', 'pw1234');

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    const setCookies = ((res.headers['set-cookie'] as unknown) as string[] | undefined);
    const cleared = setCookies?.find((c) => c.startsWith('refreshToken='));
    // Cookie should be cleared (empty value or max-age=0 / expires in the past)
    if (cleared) {
      expect(cleared).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. BUY ORDER TESTS
// ═════════════════════════════════════════════════════════════════════════════

describe('Buy orders', () => {
  it('successful buy debits cash and creates portfolio holding', async () => {
    const { token } = await registerUser('liam', 'liam@example.com', 'pw1234');

    // INTC at 4320 cents (= $43.20), buy 2 shares → total 8640 cents
    const res = await request(app)
      .post('/api/trades/buy')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.price).toBe(4320);
    expect(res.body.total_cost).toBe(8640);
    expect(res.body.new_balance).toBe(100000 - 8640); // 91360

    // Portfolio should now have 2 INTC shares
    const port = await request(app)
      .get('/api/portfolio/holdings')
      .set('Authorization', 'Bearer ' + token);
    expect(port.body.holdings).toHaveLength(1);
    expect(port.body.holdings[0].ticker).toBe('INTC');
    expect(port.body.holdings[0].quantity).toBe(2);
    expect(port.body.holdings[0].average_cost).toBe(4320);
  });

  it('buy fails when insufficient cash', async () => {
    const { token } = await registerUser('mia', 'mia@example.com', 'pw1234');

    // NVDA at 87540 cents (= $875.40); 2 shares = $1,750.80 > $1,000 balance
    const res = await request(app)
      .post('/api/trades/buy')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'NVDA', quantity: 2 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient funds/i);
    expect(res.body.available).toBe(100000);
  });

  it('buy fails with invalid ticker', async () => {
    const { token } = await registerUser('noah', 'noah@example.com', 'pw1234');

    const res = await request(app)
      .post('/api/trades/buy')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'ZZZZZ', quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('buy updates portfolio weighted average cost correctly', async () => {
    const { token } = await registerUser('olivia', 'olivia@example.com', 'pw1234');

    // First buy: 2 INTC @ 4320 cents → avg = 4320
    await request(app)
      .post('/api/trades/buy')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 2 });

    // Second buy: 3 INTC @ 4320 cents → new avg = (4320*2 + 4320*3) / 5 = 4320
    await request(app)
      .post('/api/trades/buy')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 3 });

    const port = await request(app)
      .get('/api/portfolio/holdings')
      .set('Authorization', 'Bearer ' + token);

    const intc = port.body.holdings.find((h: { ticker: string }) => h.ticker === 'INTC');
    expect(intc).toBeDefined();
    expect(intc.quantity).toBe(5);
    expect(intc.average_cost).toBe(4320);
  });

  it('buy transaction records correct price and total_cost in cents', async () => {
    const { token } = await registerUser('paul', 'paul@example.com', 'pw1234');

    await request(app)
      .post('/api/trades/buy')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 3 });

    const txRes = await request(app)
      .get('/api/account/transactions')
      .set('Authorization', 'Bearer ' + token);

    const tx = txRes.body.transactions[0];
    expect(tx.type).toBe('buy');
    expect(tx.ticker).toBe('INTC');
    expect(tx.price).toBe(4320);
    expect(tx.total_amount).toBe(4320 * 3); // 12960 cents
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. SELL ORDER TESTS
// ═════════════════════════════════════════════════════════════════════════════

describe('Sell orders', () => {
  it('successful sell credits cash', async () => {
    const { token } = await registerUser('quinn', 'quinn@example.com', 'pw1234');

    // Buy 5 INTC first
    await request(app)
      .post('/api/trades/buy')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 5 });

    const balanceAfterBuy = 100000 - 4320 * 5; // 78400

    // Sell 2 INTC
    const sellRes = await request(app)
      .post('/api/trades/sell')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 2 });

    expect(sellRes.status).toBe(201);
    expect(sellRes.body.total_proceeds).toBe(4320 * 2); // 8640
    expect(sellRes.body.new_balance).toBe(balanceAfterBuy + 4320 * 2);
  });

  it('sell fails when user has insufficient shares', async () => {
    const { token } = await registerUser('rachel', 'rachel@example.com', 'pw1234');

    // Buy 5 INTC
    await request(app)
      .post('/api/trades/buy')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 5 });

    // Try to sell 10 (more than owned)
    const res = await request(app)
      .post('/api/trades/sell')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient shares/i);
    expect(res.body.owned).toBe(5);
  });

  it('sell fails when ticker not in portfolio', async () => {
    const { token } = await registerUser('sam', 'sam@example.com', 'pw1234');

    const res = await request(app)
      .post('/api/trades/sell')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'AAPL', quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient shares/i);
  });

  it('sell removes holding from portfolio when all shares sold', async () => {
    const { token } = await registerUser('tara', 'tara@example.com', 'pw1234');

    // Buy 3, sell all 3
    await request(app)
      .post('/api/trades/buy')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 3 });

    await request(app)
      .post('/api/trades/sell')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 3 });

    const port = await request(app)
      .get('/api/portfolio/holdings')
      .set('Authorization', 'Bearer ' + token);

    expect(port.body.holdings).toHaveLength(0);
  });

  it('sell transaction recorded with correct price and total_amount in cents', async () => {
    const { token } = await registerUser('uma', 'uma@example.com', 'pw1234');

    await request(app)
      .post('/api/trades/buy')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 4 });

    await request(app)
      .post('/api/trades/sell')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 2 });

    const txRes = await request(app)
      .get('/api/account/transactions')
      .set('Authorization', 'Bearer ' + token);

    const sellTx = txRes.body.transactions.find(
      (t: { type: string }) => t.type === 'sell'
    );
    expect(sellTx).toBeDefined();
    expect(sellTx.price).toBe(4320);
    expect(sellTx.total_amount).toBe(4320 * 2); // 8640 cents
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. ADDITIONAL TESTS
// ═════════════════════════════════════════════════════════════════════════════

describe('Portfolio performance', () => {
  it('total value = cash balance + portfolio value (all in cents)', async () => {
    const { token } = await registerUser('victor', 'victor@example.com', 'pw1234');

    // Buy 3 INTC @ 4320 cents → spend 12960 cents
    await request(app)
      .post('/api/trades/buy')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 3 });

    const perfRes = await request(app)
      .get('/api/portfolio/performance')
      .set('Authorization', 'Bearer ' + token);

    expect(perfRes.status).toBe(200);
    const { cash_balance, portfolio_value, total_value } = perfRes.body;
    // Values can vary slightly due to simulated price drift, so check the relationship
    expect(total_value).toBe(cash_balance + portfolio_value);
    expect(cash_balance).toBe(100000 - 12960); // 87040 cents
  });
});

describe('Quote endpoint', () => {
  it('returns price as integer cents for a seeded ticker', async () => {
    // Quotes don't require auth
    const res = await request(app).get('/api/quotes/AAPL');

    expect(res.status).toBe(200);
    expect(typeof res.body.price).toBe('number');
    // Price should be near seeded value 18950 cents (drift ±0.2%)
    expect(res.body.price).toBeGreaterThan(18900);
    expect(res.body.price).toBeLessThan(19000);
    // Must be an integer
    expect(Number.isInteger(res.body.price)).toBe(true);
  });

  it('returns 404 for unknown ticker', async () => {
    const res = await request(app).get('/api/quotes/BOGUS');
    expect(res.status).toBe(404);
  });
});

describe('Transaction history', () => {
  it('returns all user transactions in descending order', async () => {
    const { token } = await registerUser('will', 'will@example.com', 'pw1234');

    // Do 3 transactions
    await request(app)
      .post('/api/trades/buy')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 1 });
    await request(app)
      .post('/api/trades/buy')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 2 });
    await request(app)
      .post('/api/trades/sell')
      .set('Authorization', 'Bearer ' + token)
      .send({ ticker: 'INTC', quantity: 1 });

    const res = await request(app)
      .get('/api/account/transactions')
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(3);
    // Most recent first
    expect(res.body.transactions[0].type).toBe('sell');
  });
});
