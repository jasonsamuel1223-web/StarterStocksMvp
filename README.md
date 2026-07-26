# StarterStocksMvp

A React + Vite + Node.js paper trading app for beginners.
Practice buying and selling stocks with **$1,000 of virtual cash** — no real money involved.

## Quick start

See **[SETUP.md](./SETUP.md)** for full local development instructions.

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Configure backend secrets
cp server/.env.example server/.env
# Edit server/.env — set JWT_SECRET and JWT_REFRESH_SECRET

# Run backend (port 3001)
cd server && npm run dev

# Run frontend in another terminal (port 5173)
npm run dev
```

Open http://localhost:5173, create a free account, and start paper trading.

## Build

```bash
npm run build          # frontend → dist/
cd server && npm run build  # backend  → server/dist/
```

> Educational only. Not financial advice. Paper trading only — no real money.

