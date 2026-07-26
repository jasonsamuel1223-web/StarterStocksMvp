import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { getQuote, getAllQuotes, type StockQuote } from '../api/quotes';
import { ApiError } from '../api/client';

interface TradeResult {
  message: string;
  ticker: string;
  quantity: number;
  price: number;
  total_cost?: number;
  total_proceeds?: number;
  new_balance: number;
  order_id: number;
}

interface Props {
  onTrade: () => void;
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function Trading({ onTrade }: Props) {
  const [ticker, setTicker] = useState('AAPL');
  const [quantity, setQuantity] = useState('1');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [allQuotes, setAllQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [result, setResult] = useState<TradeResult | null>(null);
  const [error, setError] = useState('');

  // Load all quotes for the dropdown
  useEffect(() => {
    getAllQuotes()
      .then((r) => setAllQuotes(r.quotes))
      .catch(() => {});
  }, []);

  // Fetch quote when ticker changes
  useEffect(() => {
    if (!ticker) return;
    setQuote(null);
    setQuoteLoading(true);
    getQuote(ticker)
      .then(setQuote)
      .catch(() => {})
      .finally(() => setQuoteLoading(false));
  }, [ticker]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) {
        setError('Enter a valid positive quantity');
        return;
      }
      const res = await api.post<TradeResult>(`/api/trades/${side}`, {
        ticker: ticker.toUpperCase(),
        quantity: qty,
      });
      setResult(res);
      onTrade();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Trade failed');
    } finally {
      setLoading(false);
    }
  }

  const estimatedTotal = quote ? parseFloat(quantity || '0') * quote.price : 0;

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr' }}>
      {/* Trade form */}
      <div className="card" style={{ maxWidth: 500 }}>
        <h3 style={{ margin: '0 0 1rem' }}>Place an order</h3>
        <p
          style={{
            margin: '0 0 1rem',
            fontSize: '0.83rem',
            color: 'var(--muted)',
            background: '#f0f7ff',
            border: '1px solid #dbe7f5',
            borderRadius: 8,
            padding: '0.5rem 0.8rem',
          }}
        >
          📋 Paper trading only — no real money involved.
        </p>

        {error && <p className="error-msg">{error}</p>}
        {result && (
          <p className="success-msg">
            {result.message}: {result.quantity} × {result.ticker} @ {fmt(result.price)}
            <br />
            New cash balance: <strong>{fmt(result.new_balance)}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {/* Side selector */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {(['buy', 'sell'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: 10,
                  border: '2px solid',
                  borderColor:
                    side === s
                      ? s === 'buy'
                        ? 'var(--good)'
                        : 'var(--bad)'
                      : 'var(--line)',
                  background:
                    side === s
                      ? s === 'buy'
                        ? '#edf8f3'
                        : '#fdf0ef'
                      : '#fff',
                  color:
                    side === s
                      ? s === 'buy'
                        ? 'var(--good)'
                        : 'var(--bad)'
                      : 'var(--muted)',
                  fontWeight: side === s ? 700 : 400,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label htmlFor="ticker-select">Ticker</label>
            {allQuotes.length > 0 ? (
              <select
                id="ticker-select"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
              >
                {allQuotes.map((q) => (
                  <option key={q.ticker} value={q.ticker}>
                    {q.ticker} — {fmt(q.price)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="ticker-select"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="AAPL"
                required
              />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Quantity (shares)</label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0.001"
              step="any"
              required
            />
          </div>

          {/* Live quote */}
          {quoteLoading && <p className="text-muted" style={{ margin: '0 0 0.8rem', fontSize: '0.9rem' }}>Fetching quote…</p>}
          {quote && !quoteLoading && (
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 10,
                padding: '0.65rem 0.9rem',
                marginBottom: '0.9rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>{quote.ticker}</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{fmt(quote.price)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                <span>
                  Change:{' '}
                  <span style={{ color: quote.change_amount >= 0 ? 'var(--good)' : 'var(--bad)' }}>
                    {quote.change_amount >= 0 ? '+' : ''}{fmt(quote.change_amount)} ({quote.change_percent >= 0 ? '+' : ''}{quote.change_percent.toFixed(2)}%)
                  </span>
                </span>
                <span>Est. {fmt(estimatedTotal)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              background:
                side === 'buy'
                  ? 'linear-gradient(110deg, #0c8a57, #0f8b8d)'
                  : 'linear-gradient(110deg, #c0392b, #e74c3c)',
            }}
          >
            {loading ? 'Processing…' : `${side === 'buy' ? 'Buy' : 'Sell'} ${ticker || '…'}`}
          </button>
        </form>
      </div>

      {/* Market overview */}
      <div className="card">
        <h3 style={{ margin: '0 0 0.8rem' }}>Available stocks</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Price</th>
                <th>Change</th>
                <th>Change %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allQuotes.map((q) => (
                <tr
                  key={q.ticker}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setTicker(q.ticker)}
                >
                  <td style={{ fontWeight: 700 }}>{q.ticker}</td>
                  <td>{fmt(q.price)}</td>
                  <td
                    style={{ color: q.change_amount >= 0 ? 'var(--good)' : 'var(--bad)' }}
                  >
                    {q.change_amount >= 0 ? '+' : ''}{fmt(q.change_amount)}
                  </td>
                  <td
                    style={{ color: q.change_percent >= 0 ? 'var(--good)' : 'var(--bad)' }}
                  >
                    {q.change_percent >= 0 ? '+' : ''}{q.change_percent.toFixed(2)}%
                  </td>
                  <td>
                    <button
                      className="btn-ghost btn-sm"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTicker(q.ticker);
                      }}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
