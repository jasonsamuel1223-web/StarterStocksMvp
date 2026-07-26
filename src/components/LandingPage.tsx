import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="page-shell">
      <div
        style={{
          position: 'absolute',
          inset: '-140px auto auto -120px',
          width: 330,
          aspectRatio: '1',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,90,149,0.25), transparent 64%)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <header className="topbar">
        <p className="brand">StarterStocks</p>
        <Link to="/login">
          <button className="btn-ghost" type="button">Sign In</button>
        </Link>
      </header>

      <section
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}
        aria-label="Hero"
      >
        <div>
          <p
            style={{
              margin: 0,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: '0.76rem',
              fontWeight: 700,
            }}
          >
            Smart investing starts simple
          </p>
          <h1
            style={{
              margin: '0.45rem 0 0',
              fontSize: 'clamp(1.8rem, 5vw, 3rem)',
              lineHeight: 1.05,
            }}
          >
            Paper-trade stocks with confidence
          </h1>
          <p style={{ margin: '0.9rem 0 0', color: 'var(--muted)', maxWidth: '38ch' }}>
            Practice buying and selling with $1,000 of virtual cash. Track your portfolio, review
            trade history, and build real investing skills — zero real money.
          </p>
          <div style={{ display: 'flex', gap: '0.7rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register">
              <button className="btn-primary" type="button">Start Free — $1,000 virtual</button>
            </Link>
            <Link to="/login">
              <button className="btn-secondary" type="button">Sign In</button>
            </Link>
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(165deg, #f9fcff 0%, #f0f7ff 100%)',
            border: '1px solid #dbe7f5',
            borderRadius: 16,
            padding: '1rem',
          }}
          aria-label="Market highlights"
        >
          <p style={{ margin: 0, fontWeight: 700 }}>Today's signal mix</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '0.7rem',
              margin: '0.9rem 0',
            }}
          >
            {[
              { label: 'Momentum', value: '+14%' },
              { label: 'Stability', value: '78/100' },
              { label: 'Volatility', value: 'Low' },
              { label: 'Entries', value: '3 ideas' },
            ].map((item) => (
              <article
                key={item.label}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #e0e8f3',
                  padding: '0.65rem',
                }}
              >
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.83rem' }}>
                  {item.label}
                </p>
                <strong style={{ margin: 0 }}>{item.value}</strong>
              </article>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
            Simulated data — educational only
          </p>
        </div>
      </section>

      <section style={{ marginTop: '1.2rem' }} aria-label="Starter stock watchlist">
        <h2 style={{ margin: 0 }}>Starter watchlist</h2>
        <div
          style={{
            marginTop: '0.8rem',
            display: 'grid',
            gap: '0.65rem',
          }}
        >
          {[
            { ticker: 'NOVA', sector: 'Cloud Infra', change: '+2.7%', up: true },
            { ticker: 'PXEL', sector: 'Consumer Apps', change: '+1.1%', up: true },
            { ticker: 'RIVT', sector: 'EV Supply', change: '-0.8%', up: false },
          ].map((s) => (
            <article
              key={s.ticker}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: '0.75rem 0.9rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>{s.ticker}</h3>
                <p style={{ margin: '0.15rem 0 0', color: 'var(--muted)', fontSize: '0.84rem' }}>
                  {s.sector}
                </p>
              </div>
              <strong style={{ color: s.up ? 'var(--good)' : 'var(--bad)' }}>{s.change}</strong>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          marginTop: '1.2rem',
          display: 'grid',
          gap: '0.7rem',
        }}
        aria-label="Features"
      >
        {[
          {
            title: 'Paper trading',
            body: 'Buy and sell stocks with $1,000 of simulated cash — no risk, all the learning.',
          },
          {
            title: 'Portfolio tracking',
            body: 'See your holdings, cost basis, unrealized gains, and overall performance at a glance.',
          },
          {
            title: 'Transaction history',
            body: 'Full audit trail of every trade so you can review decisions and improve over time.',
          },
        ].map((f) => (
          <article
            key={f.title}
            style={{
              border: '1px solid var(--line)',
              borderRadius: 14,
              background: '#fff',
              padding: '0.8rem',
            }}
          >
            <h3 style={{ margin: 0 }}>{f.title}</h3>
            <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>{f.body}</p>
          </article>
        ))}
      </section>

      <footer
        style={{
          marginTop: '1.2rem',
          paddingTop: '0.8rem',
          borderTop: '1px solid var(--line)',
        }}
      >
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Built for first-time investors. Paper trading only — no real money involved.
        </p>
      </footer>
    </div>
  );
}
