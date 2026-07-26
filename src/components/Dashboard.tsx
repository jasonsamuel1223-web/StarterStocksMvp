import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { logout, clearTokens } from '../api/auth';
import { getSummary, type PortfolioSummary } from '../api/portfolio';
import Portfolio from './Portfolio';
import Trading from './Trading';
import Transactions from './Transactions';

interface Props {
  onLogout: () => void;
}

type Tab = 'portfolio' | 'trade' | 'history';

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function pct(n: number) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export default function Dashboard({ onLogout }: Props) {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('portfolio');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getSummary()
      .then(setSummary)
      .catch(console.error);
  }, [refreshKey]);

  async function handleLogout() {
    await logout().catch(() => {});
    clearTokens();
    onLogout();
  }

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  const gainLossColor =
    !summary ? 'inherit' : summary.total_gain_loss >= 0 ? 'var(--good)' : 'var(--bad)';

  return (
    <div className="page-shell">
      {/* Topbar */}
      <header className="topbar">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <p className="brand">StarterStocks</p>
        </Link>
        <button className="btn-ghost btn-sm" type="button" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      {/* Summary Stats */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.7rem',
            marginBottom: '1rem',
          }}
        >
          <div className="stat-card">
            <p className="stat-label">Total value</p>
            <p className="stat-value">{fmt(summary.total_value)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Cash</p>
            <p className="stat-value">{fmt(summary.cash_balance)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Portfolio</p>
            <p className="stat-value">{fmt(summary.portfolio_value)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Total P&amp;L</p>
            <p className="stat-value" style={{ color: gainLossColor }}>
              {fmt(summary.total_gain_loss)}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Return</p>
            <p
              className="stat-value"
              style={{
                color: gainLossColor,
                fontSize: '1.2rem',
              }}
            >
              {pct((summary.total_gain_loss / summary.starting_balance) * 100)}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          borderBottom: '2px solid var(--line)',
          marginBottom: '1rem',
        }}
      >
        {(
          [
            { id: 'portfolio', label: 'Portfolio' },
            { id: 'trade', label: 'Trade' },
            { id: 'history', label: 'History' },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              background: 'none',
              border: 'none',
              borderRadius: 0,
              borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2,
              padding: '0.5rem 1rem',
              fontWeight: activeTab === t.id ? 700 : 400,
              color: activeTab === t.id ? 'var(--primary)' : 'var(--muted)',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'portfolio' && <Portfolio refreshKey={refreshKey} />}
      {activeTab === 'trade' && <Trading onTrade={refresh} />}
      {activeTab === 'history' && <Transactions refreshKey={refreshKey} />}
    </div>
  );
}
