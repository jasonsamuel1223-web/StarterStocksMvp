import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database';
import { User } from '../models/types';

const SALT_ROUNDS = 12;
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateTokens(userId: number, username: string) {
  const secret = process.env.JWT_SECRET!;
  const refreshSecret = process.env.JWT_REFRESH_SECRET!;
  const expiresIn = (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
  const refreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

  const token = jwt.sign({ userId, username }, secret, { expiresIn });
  const refreshToken = jwt.sign({ userId, username }, refreshSecret, { expiresIn: refreshExpiresIn });
  return { token, refreshToken };
}

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !email || !password) {
      res.status(400).json({ error: 'username, email and password are required' });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }
    if (!email.includes('@')) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    const existing = db
      .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username, email) as { id: number } | undefined;

    if (existing) {
      res.status(409).json({ error: 'Username or email already in use' });
      return;
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const insertUser = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    );
    // Starting balance: 100000 cents = $1,000.00
    const insertAccount = db.prepare(
      'INSERT INTO accounts (user_id, balance, starting_balance) VALUES (?, 100000, 100000)'
    );

    const createUserAndAccount = db.transaction(() => {
      const result = insertUser.run(username, email, password_hash);
      insertAccount.run(result.lastInsertRowid);
      return result.lastInsertRowid as number;
    });

    const userId = createUserAndAccount();
    const { token, refreshToken } = generateTokens(userId, username);

    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: userId, username, email },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as User | undefined;

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const { token, refreshToken } = generateTokens(user.id, user.username);

    setRefreshCookie(res, refreshToken);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function logout(_req: Request, res: Response): void {
  clearRefreshCookie(res);
  res.json({ message: 'Logged out successfully' });
}

export function refresh(req: Request, res: Response): void {
  try {
    const refreshToken = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      res.status(400).json({ error: 'No refresh token' });
      return;
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET!;
    const payload = jwt.verify(refreshToken, refreshSecret) as {
      userId: number;
      username: string;
    };

    const { token, refreshToken: newRefresh } = generateTokens(payload.userId, payload.username);
    setRefreshCookie(res, newRefresh);
    res.json({ token });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}
