# THE WALL RH Roadmap

> Building the ultimate analytics + Stock Token platform for Robinhood Chain (4663)

**Official X:** [@officialWALLrh](https://x.com/officialWALLrh) · **Live:** [rh-builders.vercel.app](https://rh-builders.vercel.app)

---

## Phase 1 — Foundation ✅

- [x] Project setup (Next.js 16, React 19, Tailwind CSS v4, TypeScript)
- [x] Dark/light mode with 8 accent themes + custom color picker
- [x] 80-language i18n with region-based filtering
- [x] PWA support (installable on mobile & desktop)
- [x] Responsive layout with mobile hamburger nav
- [x] Glassmorphism UI (backdrop-blur header, cards)
- [x] Accessibility (skip-to-content, focus rings, reduced-motion, screen reader)

---

## Phase 2 — Core Pages ✅

- [x] Dashboard (`/`) — Hero, live network stats, sparklines, top builders, live transactions, news
- [x] Builders (`/builder`) — Full builder list with sort, tag filter, search
- [x] Builder Profile (`/builder/[address]`) — Token holdings, balance history, X profile, rewards
- [x] Market (`/market`) — Stock & crypto quotes, watchlist, gainers/losers, detail modals
- [x] Profile (`/profile`) — Wallet-connected portfolio: holdings, ETH balance, trade history
- [x] Stock Token (`/stock/[symbol]`) — Company profile, live quote & chart, Buy/Sell
- [x] Token Profile (`/token/[address]`) — DexScreener pair data + X account + chain links
- [x] X Profile (`/x/[handle]`) — Live X/Twitter profile for any handle
- [x] Team (`/team`) — Team profile with live X/Twitter data
- [x] Settings (`/settings`) — Language selection, theme customization
- [x] About (`/about`) — Full site guide ("How to use" / "How it works")
- [x] Legal (`/legal/*`) — Terms, Privacy, Cookies

> **Note:** The Global Search page (`/global`), KOL Hub (`/kol`), and email/X login
> (`/auth`) were built and then removed during production cleanup. The site is now a
> fully open, no-login platform. Search is handled by the inline search bar
> (builders / tokens / X handles), and live X profiles live at `/x/[handle]`.

---

## Phase 3 — Data & API ✅

- [x] Blockscout V2 integration (on-chain data, token transfers, balance history)
- [x] DexScreener integration (DEX pairs, volume, liquidity, price changes, token logos)
- [x] Financial Modeling Prep integration (stock & crypto market data)
- [x] Yahoo Finance integration (primary quotes + 24/7 market news)
- [x] X/Twitter profile scraping & oembed integration
- [x] 31 production API routes (dead/unused routes removed)
- [x] Upstash Redis rate limiting (60 req/min per IP)

---

## Phase 4 — Builder Intelligence ✅

- [x] Per-token DexScreener data on builder profiles (price, MCap, liquidity, volume, buys/sells)
- [x] Creator reward tracking per token (claimed amount, claim count, last claim)
- [x] Token holdings with enriched DEX data
- [x] Contract deployer info & verification badges
- [x] Builder search by wallet address, ENS, token CA, X handle

---

## Phase 5 — Stock Token Marketplace ✅

- [x] Stock Tokens page — 90+ 1:1-backed tokens (NVDA, AAPL, TSLA, QQQ, …) with real quotes
- [x] Official Stock Token logos from the Robinhood CDN (deterministic per token address)
- [x] Live board, watchlist, gainers/losers/movers with sparklines
- [x] Real-time stock market quotes 24/7 (Yahoo Finance primary + FMP fallback)
- [x] Detail modal with 52-week range, volume, market cap, PE, and live 5s refresh
- [x] **Market News 24/7** — Latest headlines per symbol, cached 60s
- [x] **On X** — Live market-voice profiles (@robinhood, @CNBC, @MarketWatch, @WSJMarkets, @Stocktwits, @Nasdaq)
- [x] **See what's onchain** — Real-time chain dashboard (live blocks, live transactions, chain stats) 24/7
- [x] Real wallet connect + disconnect (RainbowKit: MetaMask / WalletConnect / Coinbase)
- [x] Real token balances from Blockscout per wallet
- [x] Real on-chain swaps via LI.FI (ETH → Stock Tokens, etc.), tx links to Blockscout
- [x] Ecosystem apps grid (live from Robinhood Chain ecosystem)
- [x] Per-stock detail pages (`/stock/[symbol]`)

---

## Phase 6 — Performance, Logos & Publishing ✅

- [x] Critical-path rendering (page paints before slow feeds load)
- [x] Staggered refresh intervals (15s/30s/60s/300s) to cut network chatter
- [x] Lazy-loaded swap panel (bundle split)
- [x] CDN cache headers on hot APIs via middleware (5s–1h)
- [x] About Us page with full site guide for all pages
- [x] SEO fixes (metadata, sitemap, robots, OG image)
- [x] Live token logo resolution with letter-avatar fallbacks across claims, rewards, builders, and token pages
- [x] Official X account [@officialWALLrh](https://x.com/officialWALLrh) featured on Team page

---

## Phase 7 — Coming Soon

### Notifications & Alerts
- [ ] Price alert system (email / push / X DM)
- [ ] New token launch notifications
- [ ] Builder activity alerts (new deploy, large transfer)
- [ ] DEX volume spike alerts

### Portfolio Tracking
- [ ] Wallet portfolio dashboard with total value
- [ ] Multi-wallet tracking
- [ ] PnL calculations (realized & unrealized)
- [ ] Token performance over time charts
- [ ] Portfolio share link

### Advanced Analytics
- [ ] Builder leaderboard with scoring algorithm
- [ ] Token launch success rate metrics
- [ ] Whale tracking & large transfer alerts
- [ ] On-chain reputation score
- [ ] Contract audit status integration

### Social & Community
- [ ] Official X announcements & market updates pipeline
- [ ] Builder Following system (follow/unfollow)
- [ ] Activity feed (followed builders)
- [ ] Comment system on builder profiles
- [ ] Builder verified program (on-chain badge)
- [ ] Community reports & flags

### Token Launchpad
- [ ] Token launch submission form
- [ ] Launch verification pipeline
- [ ] Anti-rug score display
- [ ] Liquidity lock verification
- [ ] Launch calendar / upcoming tokens

### Stock Token Expansion
- [ ] More stock tokens + index tokens
- [ ] Fractional trading on-chain
- [ ] Yield & borrow against Stock Tokens ("Unlock more opportunities")
- [ ] On-chain Stock Token order book

### API & Integrations
- [ ] Public API for developers
- [ ] Webhook support for real-time events
- [ ] Telegram bot for alerts
- [ ] Discord bot integration
- [ ] Multi-chain support (Ethereum, Base, Arbitrum)

### Mobile
- [ ] Native mobile app (React Native)
- [ ] Push notifications
- [ ] Deep linking for token/builder share

---

## Phase 8 — Long-Term Vision

- [ ] Governance dashboard (on-chain proposals)
- [ ] DeFi yield tracker
- [ ] NFT analytics
- [ ] AI-powered builder insights
- [ ] Custom dashboard builder (drag & drop widgets)
- [ ] White-label analytics for other chains

---

## Tech Debt & Improvements

- [ ] Add unit & integration tests
- [ ] Optimize API response caching (Redis / ISR)
- [ ] Add error monitoring (Sentry)
- [ ] Add analytics (Plausible / Umami)
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Add end-to-end tests (Playwright)
