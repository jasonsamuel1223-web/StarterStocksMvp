import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authLimiter, apiLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/auth';
import accountRoutes from './routes/account';
import tradesRoutes from './routes/trades';
import quotesRoutes from './routes/quotes';
import portfolioRoutes from './routes/portfolio';

/**
 * CSRF mitigation strategy:
 *  - All data-mutation endpoints (buy, sell, account) require a short-lived
 *    ****** token in the Authorization header. Cross-origin requests
 *    cannot set custom headers, so these routes are inherently CSRF-safe.
 *  - The refresh token is stored in an HttpOnly cookie with SameSite=Strict,
 *    which prevents cross-origin requests from including it automatically.
 *  - The /api/auth/refresh and /api/auth/logout routes additionally enforce
 *    that requests carry application/json content or the correct Origin header,
 *    providing defence-in-depth against CSRF for the cookie-consuming endpoints.
 */

/** Middleware: reject requests that don't look like they originate from the
 *  configured SPA origin. Applied only to cookie-consuming auth endpoints. */
function requireSameOrigin(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'test') {
    next();
    return;
  }
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const origin = req.headers.origin ?? req.headers.referer ?? '';
  if (!origin.startsWith(allowedOrigin)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}

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

  // Routes — auth gets a strict limiter; other routes use the general limiter.
  // requireSameOrigin is applied to cookie-consuming endpoints within authRoutes.
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

export { requireSameOrigin };
export default createApp();
