import { useEffect, useState } from 'react';
import { getPerformance, type PortfolioPerformance } from '../api/portfolio';

interface Props {
  refreshKey: number;
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function pct(n: number) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export default function Portfolio({ refreshKey }: Props) {
  const [data, setData] = useState<PortfolioPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getPerformance()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <p className="loading">Loading portfolio…</p>;
  if (error) return <p className="error-msg">{error}</p>;
  if (!data) return null;

  const hasHoldings = data.holdings.length > 0;

  return (
    <div>
      {/* Summary row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.6rem',
          marginBottom: '1.2rem',
        }}
      >
        <div className="stat-card">
          <p className="stat-label">Portfolio value</p>
          <p className="stat-value">{fmt(data.portfolio_value / 100)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Cost basis</p>
          <p className="stat-value">{fmt(data.cost_basis / 100)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Unrealized P&amp;L</p>
          <p
            className="stat-value"
            style={{ color: data.unrealized_gain_loss >= 0 ? 'var(--good)' : 'var(--bad)' }}
          >
            {fmt(data.unrealized_gain_loss / 100)}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Overall return</p>
          <p
            className="stat-value"
            style={{
              color: data.overall_gain_loss >= 0 ? 'var(--good)' : 'var(--bad)',
              fontSize: '1.2rem',
            }}
          >
            {pct(data.overall_gain_loss_percent)}
          </p>
        </div>
      </div>

      {/* Holdings table */}
      {hasHoldings ? (
        <div className="card" style={{ overflowX: 'auto' }}>
          <h3 style={{ margin: '0 0 0.8rem' }}>Holdings</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Qty</th>
                <th>Avg cost</th>
                <th>Price</th>
                <th>Value</th>
                <th>P&amp;L</th>
                <th>P&amp;L %</th>
              </tr>
            </thead>
            <tbody>
              {data.holdings.map((h) => (
                <tr key={h.ticker}>
                  <td style={{ fontWeight: 700 }}>{h.ticker}</td>
                  <td>{h.quantity}</td>
                  <td>{fmt(h.average_cost / 100)}</td>
                  <td>{fmt(h.current_price / 100)}</td>
                  <td>{fmt(h.current_value / 100)}</td>
                  <td style={{ color: h.gain_loss >= 0 ? 'var(--good)' : 'var(--bad)' }}>
                    {fmt(h.gain_loss / 100)}
                  </td>
                  <td style={{ color: h.gain_loss_percent >= 0 ? 'var(--good)' : 'var(--bad)' }}>
                    {pct(h.gain_loss_percent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            No holdings yet. Go to the <strong>Trade</strong> tab to buy your first stock.
          </p>
        </div>
      )}
    </div>
  );
}
