import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './data/starterstocks.db';
const resolvedPath = path.resolve(DB_PATH);

// Ensure the data directory exists
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db: DatabaseType = new Database(resolvedPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
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
      balance REAL NOT NULL DEFAULT 1000.00,
      starting_balance REAL NOT NULL DEFAULT 1000.00,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ticker TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      average_cost REAL NOT NULL DEFAULT 0,
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
      price REAL NOT NULL,
      total_amount REAL NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stock_quotes (
      ticker TEXT PRIMARY KEY,
      price REAL NOT NULL,
      change_amount REAL NOT NULL DEFAULT 0,
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
      price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'filled', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  seedStockQuotes();
}

function seedStockQuotes(): void {
  const mockStocks = [
    { ticker: 'AAPL', price: 189.50, change_amount: 2.30, change_percent: 1.23, volume: 55_000_000 },
    { ticker: 'MSFT', price: 415.20, change_amount: -1.80, change_percent: -0.43, volume: 22_000_000 },
    { ticker: 'GOOGL', price: 172.80, change_amount: 3.10, change_percent: 1.83, volume: 18_000_000 },
    { ticker: 'AMZN', price: 198.60, change_amount: -0.90, change_percent: -0.45, volume: 30_000_000 },
    { ticker: 'TSLA', price: 245.80, change_amount: 8.40, change_percent: 3.54, volume: 70_000_000 },
    { ticker: 'NVDA', price: 875.40, change_amount: 22.60, change_percent: 2.65, volume: 45_000_000 },
    { ticker: 'META', price: 510.30, change_amount: -4.20, change_percent: -0.82, volume: 14_000_000 },
    { ticker: 'NFLX', price: 628.90, change_amount: 11.20, change_percent: 1.81, volume: 5_000_000 },
    { ticker: 'AMD', price: 168.70, change_amount: 5.30, change_percent: 3.24, volume: 35_000_000 },
    { ticker: 'INTC', price: 43.20, change_amount: -0.60, change_percent: -1.37, volume: 28_000_000 },
    { ticker: 'DIS', price: 112.40, change_amount: 1.80, change_percent: 1.63, volume: 10_000_000 },
    { ticker: 'SPOT', price: 328.50, change_amount: 7.20, change_percent: 2.24, volume: 3_000_000 },
    { ticker: 'NOVA', price: 78.30, change_amount: 2.10, change_percent: 2.76, volume: 2_000_000 },
    { ticker: 'PXEL', price: 34.50, change_amount: 0.38, change_percent: 1.11, volume: 1_500_000 },
    { ticker: 'RIVT', price: 15.20, change_amount: -0.12, change_percent: -0.78, volume: 8_000_000 },
    { ticker: 'SPY',  price: 512.60, change_amount: 4.20, change_percent: 0.83, volume: 80_000_000 },
    { ticker: 'QQQ',  price: 445.80, change_amount: 6.10, change_percent: 1.39, volume: 40_000_000 },
  ];

  const upsert = db.prepare(`
    INSERT INTO stock_quotes (ticker, price, change_amount, change_percent, volume, last_updated)
    VALUES (@ticker, @price, @change_amount, @change_percent, @volume, datetime('now'))
    ON CONFLICT(ticker) DO NOTHING
  `);

  const insertMany = db.transaction((stocks: typeof mockStocks) => {
    for (const stock of stocks) {
      upsert.run(stock);
    }
  });

  insertMany(mockStocks);
}

export default db;
