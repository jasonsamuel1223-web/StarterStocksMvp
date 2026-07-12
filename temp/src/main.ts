import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div class="ambient-bg" aria-hidden="true"></div>

<header class="topbar">
  <p class="brand">StarterStocks</p>
  <button class="ghost-btn" type="button">Sign In</button>
</header>

<section class="hero">
  <div class="hero-copy">
    <p class="eyebrow">Smart investing starts simple</p>
    <h1>A polished, mobile-friendly stock starter</h1>
    <p class="subtitle">
      Track momentum, compare risk, and plan your first portfolio with clean,
      digestible signals built for phone and desktop.
    </p>
    <div class="hero-actions">
      <button class="primary-btn" type="button">Start Free</button>
      <button class="secondary-btn" type="button">See Demo</button>
    </div>
  </div>

  <div class="signal-card" aria-label="Market highlights">
    <p class="signal-title">Today's signal mix</p>
    <div class="signal-grid">
      <article>
        <p>Momentum</p>
        <strong>+14%</strong>
      </article>
      <article>
        <p>Stability</p>
        <strong>78/100</strong>
      </article>
      <article>
        <p>Volatility</p>
        <strong>Low</strong>
      </article>
      <article>
        <p>Entries</p>
        <strong>3 ideas</strong>
      </article>
    </div>
    <p class="signal-note">Updated every 5 minutes</p>
  </div>
</section>

<section class="watchlist" aria-label="Starter stock watchlist">
  <h2>Starter watchlist</h2>
  <div class="watchlist-grid">
    <article class="stock up">
      <div>
        <h3>NOVA</h3>
        <p>Cloud Infra</p>
      </div>
      <strong>+2.7%</strong>
    </article>
    <article class="stock up">
      <div>
        <h3>PXEL</h3>
        <p>Consumer Apps</p>
      </div>
      <strong>+1.1%</strong>
    </article>
    <article class="stock down">
      <div>
        <h3>RIVT</h3>
        <p>EV Supply</p>
      </div>
      <strong>-0.8%</strong>
    </article>
  </div>
</section>

<section class="insights" aria-label="Insights and education">
  <article>
    <h3>Smart prompts</h3>
    <p>Get clear explanations before each trade so you know why a pick appears.</p>
  </article>
  <article>
    <h3>Risk guardrails</h3>
    <p>Set portfolio limits and receive alerts when any sector is overexposed.</p>
  </article>
  <article>
    <h3>Learning snippets</h3>
    <p>Understand terms like P/E, volume, and support levels in plain language.</p>
  </article>
</section>

<footer class="footer">
  <p>Built for first-time investors who want confidence, not noise.</p>
</footer>
`

document.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
  button.addEventListener('click', () => {
    button.blur()
  })
})
