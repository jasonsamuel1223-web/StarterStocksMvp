import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Transaction {
  id: number;
  ticker: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_amount: number;
  timestamp: string;
}

interface Props {
  refreshKey: number;
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function fmtDate(ts: string) {
  return new Date(ts.replace(' ', 'T') + 'Z').toLocaleString();
}

export default function Transactions({ refreshKey }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get<{ transactions: Transaction[] }>('/api/account/transactions')
      .then((r) => setTransactions(r.transactions))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <p className="loading">Loading history…</p>;
  if (error) return <p className="error-msg">{error}</p>;

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 0.8rem' }}>Transaction history</h3>

      {transactions.length === 0 ? (
        <p className="text-muted" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          No transactions yet. Use the <strong>Trade</strong> tab to place your first order.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Ticker</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    {fmtDate(tx.timestamp)}
                  </td>
                  <td style={{ fontWeight: 700 }}>{tx.ticker}</td>
                  <td>
                    <span className={`badge badge-${tx.type}`}>
                      {tx.type.toUpperCase()}
                    </span>
                  </td>
                  <td>{tx.quantity}</td>
                  <td>{fmt(tx.price)}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(tx.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
