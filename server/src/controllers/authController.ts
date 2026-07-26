import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database';
import { User } from '../models/types';

const SALT_ROUNDS = 12;

function generateTokens(userId: number, username: string) {
  const secret = process.env.JWT_SECRET!;
  const refreshSecret = process.env.JWT_REFRESH_SECRET!;
  const expiresIn = (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
  const refreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

  const token = jwt.sign({ userId, username }, secret, { expiresIn });
  const refreshToken = jwt.sign({ userId, username }, refreshSecret, { expiresIn: refreshExpiresIn });
  return { token, refreshToken };
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
    const insertAccount = db.prepare(
      'INSERT INTO accounts (user_id, balance, starting_balance) VALUES (?, 1000.00, 1000.00)'
    );

    const createUserAndAccount = db.transaction(() => {
      const result = insertUser.run(username, email, password_hash);
      insertAccount.run(result.lastInsertRowid);
      return result.lastInsertRowid as number;
    });

    const userId = createUserAndAccount();
    const { token, refreshToken } = generateTokens(userId, username);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      refreshToken,
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

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function logout(_req: Request, res: Response): void {
  // Stateless JWT — instruct client to discard tokens
  res.json({ message: 'Logged out successfully' });
}

export function refresh(req: Request, res: Response): void {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken is required' });
      return;
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET!;
    const payload = jwt.verify(refreshToken, refreshSecret) as {
      userId: number;
      username: string;
    };

    const { token, refreshToken: newRefresh } = generateTokens(payload.userId, payload.username);
    res.json({ token, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}
