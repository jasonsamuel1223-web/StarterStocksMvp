# StarterStocks — Local Development Setup

This project has two parts that run together:
- **Frontend** — React + Vite (port 5173)
- **Backend** — Node.js + Express + TypeScript (port 3001)

---

## Prerequisites

- Node.js 18 or newer (tested on Node 18–24)
- npm 9+

---

## 1 — Clone & install

```bash
git clone https://github.com/jasonsamuel1223-web/StarterStocksMvp.git
cd StarterStocksMvp
```

### Install frontend dependencies

```bash
npm install
```

### Install backend dependencies

```bash
cd server
npm install
cd ..
```

---

## 2 — Configure environment variables

### Backend

```bash
cp server/.env.example server/.env
```

Open `server/.env` and set a strong `JWT_SECRET` and `JWT_REFRESH_SECRET`:

```bash
# Generate secrets (run each separately):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Paste the output into the corresponding variables in `server/.env`.

### Frontend (optional)

```bash
cp .env.example .env
```

The default `VITE_API_BASE_URL` is empty — when empty the frontend uses Vite's dev proxy
(which forwards `/api/*` to `http://localhost:3001`), so **no change is needed for local dev**.

---

## 3 — Run both servers

### Terminal 1 — backend

```bash
cd server
npm run dev
```

The API will start on **http://localhost:3001**.

### Terminal 2 — frontend

```bash
# from the project root
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 4 — Create an account

1. Click **Create one free** on the landing page.
2. Enter a username, email, and password (≥ 6 chars).
3. You'll be logged in with a **$1,000 virtual cash** balance.
4. Use the **Trade** tab to buy/sell simulated stocks.
5. Use the **Portfolio** tab to track your holdings.
6. Use the **History** tab to review all transactions.

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Sign in |
| POST | `/api/auth/logout` | — | Sign out |
| POST | `/api/auth/refresh` | — | Refresh JWT |
| GET | `/api/account/info` | ✓ | Account + user info |
| GET | `/api/account/balance` | ✓ | Cash balance |
| GET | `/api/account/portfolio` | ✓ | Portfolio with live prices |
| GET | `/api/account/transactions` | ✓ | Full transaction list |
| POST | `/api/trades/buy` | ✓ | Buy shares |
| POST | `/api/trades/sell` | ✓ | Sell shares |
| GET | `/api/trades/orders` | ✓ | Order history |
| GET | `/api/trades/orders/:id` | ✓ | Single order |
| GET | `/api/quotes` | — | All simulated quotes |
| GET | `/api/quotes/:ticker` | — | Single stock quote |
| GET | `/api/portfolio/holdings` | ✓ | Current holdings |
| GET | `/api/portfolio/performance` | ✓ | Holdings with P&L |
| GET | `/api/portfolio/summary` | ✓ | Account summary |

---

## Available tickers (simulated)

`AAPL`, `MSFT`, `GOOGL`, `AMZN`, `TSLA`, `NVDA`, `META`, `NFLX`, `AMD`, `INTC`,
`DIS`, `SPOT`, `NOVA`, `PXEL`, `RIVT`, `SPY`, `QQQ`

---

## Production build

```bash
# Frontend
npm run build         # outputs to dist/

# Backend
cd server
npm run build         # outputs to server/dist/
npm start             # runs server/dist/index.js
```

---

## Important notes

- **Paper trading only** — no real money, no brokerage connections.
- **Simulated prices** — stock prices are seeded mock values with minor random drift per request.
- **No secrets in repo** — all sensitive values live in `.env` files (gitignored).
- The SQLite database is created automatically in `server/data/starterstocks.db` on first run.
