import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database';
import { authLimiter, apiLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/auth';
import accountRoutes from './routes/account';
import tradesRoutes from './routes/trades';
import quotesRoutes from './routes/quotes';
import portfolioRoutes from './routes/portfolio';

// Validate required env vars
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error(
    'ERROR: JWT_SECRET and JWT_REFRESH_SECRET must be set in .env\n' +
    'Copy server/.env.example to server/.env and fill in your secrets.'
  );
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 3001;

// Initialize database
initializeDatabase();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes — auth gets a strict limiter; other routes use the general limiter
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/account', apiLimiter, accountRoutes);
app.use('/api/trades', apiLimiter, tradesRoutes);
app.use('/api/quotes', apiLimiter, quotesRoutes);
app.use('/api/portfolio', apiLimiter, portfolioRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

app.listen(PORT, () => {
  console.log(`StarterStocks API running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
