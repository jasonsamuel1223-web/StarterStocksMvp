import 'dotenv/config';
import { initializeDatabase } from './database';
import { createApp } from './app';

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

const app = createApp();

app.listen(PORT, () => {
  console.log(`StarterStocks API running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
