import { useState } from 'react';
import { Link } from 'react-router-dom';
import { register, saveTokens } from '../api/auth';
import { ApiError } from '../api/client';

interface Props {
  onRegister: () => void;
}

export default function Register({ onRegister }: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await register(username, email, password);
      saveTokens(res.token);
      onRegister();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell" style={{ maxWidth: 440, marginTop: '3rem' }}>
      <header className="topbar">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <p className="brand">StarterStocks</p>
        </Link>
      </header>

      <h1 style={{ margin: '0 0 0.4rem', fontSize: '1.6rem' }}>Create your account</h1>
      <p style={{ margin: '0 0 1.2rem', color: 'var(--muted)' }}>
        You'll start with <strong>$1,000</strong> in virtual cash to paper-trade.
      </p>

      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            required
            minLength={3}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="at least 6 characters"
            required
            minLength={6}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
          Sign in
        </Link>
      </p>

      <p
        style={{
          textAlign: 'center',
          marginTop: '1.2rem',
          color: 'var(--muted)',
          fontSize: '0.78rem',
          borderTop: '1px solid var(--line)',
          paddingTop: '0.8rem',
        }}
      >
        Paper trading only — no real money involved.
      </p>
    </div>
  );
}
