import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authLimiter, apiLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/auth';
import accountRoutes from './routes/account';
import tradesRoutes from './routes/trades';
import quotesRoutes from './routes/quotes';
import portfolioRoutes from './routes/portfolio';

export function createApp(): express.Application {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

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

  return app;
}

export default createApp();
