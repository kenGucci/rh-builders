# THE WALL RH

> Real-time builder analytics + Stock Token marketplace for [Robinhood Chain](https://robinhoodchain.blockscout.com) (Chain ID 4663)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06b6d4?logo=tailwindcss)
![X](https://img.shields.io/badge/X-@officialWALLrh-000000?logo=x)

**Live:** [rh-builders.vercel.app](https://rh-builders.vercel.app) · **Official X:** [@officialWALLrh](https://x.com/officialWALLrh)

---

## What is THE WALL RH?

THE WALL RH is a full-stack platform for **Robinhood Chain** — combining a real-time on-chain analytics dashboard with a **Stock Token marketplace**. Track builders, tokens, live market data, and real on-chain activity — all in one dark-mode dashboard with a polished UI.

## Pages

### Dashboard (`/`)
The landing page with a hero section, live network stats (transactions, blocks, addresses, block time), sparkline charts, top builder cards, and latest crypto news. Includes a global search bar through the whole platform.

### Global Search (`/global`)
A multi-category search engine powered by DuckDuckGo, YouTube, OpenStreetMap, and Wikipedia. Supports web, news, images, videos, and maps results with full-text search history saved in localStorage.

### Builders (`/builder`)
Browse all builders on Robinhood Chain with aggregate stats (total addresses, transactions, ERC-20 tokens, network block). Shows trending launchpads, deployed tech overview, DexScreener token grid, and more.

### Builder Profile (`/builder/[address]`)
Deep-dive into any address: ETH/token balance, transaction count, token holdings table, balance history chart, X/Twitter profile card, contract deployer info, and developer rewards panel with claim history.

### Market (`/market`)
The Stock Token marketplace — **90+ 1:1-backed Stock Tokens** (NVDA, AAPL, TSLA, QQQ, and more), live quotes running 24/7, gainers/losers/movers, watchlist, and detail modals.

- **Market News 24/7** — Latest headlines for the tokens behind Stock Tokens, pulled live from Yahoo Finance.
- **On X** — Live X profiles of the market voices moving the stock world (@robinhood, @CNBC, @MarketWatch, @WSJMarkets, @Stocktwits, @Nasdaq).
- **See what's onchain** — Real-time chain dashboard: live blocks, live transactions, chain stats (25M+ blocks, 220M+ txs, gas, RH price) from Blockscout, running 24/7.
- **Real swaps** — Connect your wallet (MetaMask / WalletConnect / Coinbase) to check balances, disconnect, and swap Stock Tokens directly on Robinhood Chain via LI.FI.
- **Real on-chain txns** — Live DEX transactions from DexScreener and real chain transactions verified on Blockscout.

### Team (`/team`)
Team profile page with the **Official X account** ([@officialWALLrh](https://x.com/officialWALLrh)) plus the lead developer ([@suggestionii](https://x.com/suggestionii)) — live banner, avatar, bio, follower stats, and Follow buttons.

### X Profile (`/x/[handle]`)
Any X/Twitter handle resolves to a live profile page — banner, avatar, description, follower counts, location, and join date, all fetched live from X.

### About Us (`/about`)
Full site guide covering every page with "How to use" and "How it works" walkthroughs.

### Settings (`/settings`)
Language and theme configuration. Supports 80 languages with 15 fully translated (EN, ZH, ES, FR, DE, PT, AR, HI, JA, KO, RU, VI, TR, TH, ID). 8 preset accent colors plus a custom hex color picker with live preview.

### Auth (`/auth`)
Email + password authentication, secured with PBKDF2 hashing and JWT tokens.

## Architecture

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── page.tsx            # Dashboard landing
│   ├── about/              # About Us + site guide
│   ├── auth/               # Authentication
│   ├── builder/            # Builder list + detail pages
│   ├── global/             # Global search engine
│   ├── market/             # Stock Token marketplace + real-time on-chain dashboard
│   ├── settings/           # Language & theme settings
│   ├── team/               # Team + official X account
│   ├── token/              # Token profile pages
│   ├── x/                  # Live X profile pages
│   └── api/                # 40+ API route handlers
├── components/             # Reusable UI components
├── lib/                    # Services, utilities, data
└── types/                  # TypeScript declarations
```

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React Server Components)
- **UI:** React 19, Tailwind CSS v4.3, Lucide icons, RainbowKit + wagmi (wallet), react-blockies, custom CSS animations
- **Backend:** Next.js API routes (serverless) + middleware (`src/proxy.ts`) with CDN caching and CSP
- **Database:** Supabase (PostgreSQL)
- **Auth:** JWT (jose), OTP email, X/Twitter OAuth 2.0 PKCE
- **Rate Limiting:** Upstash Redis + Ratelimit
- **Data Sources:**
  - [Blockscout](https://robinhoodchain.blockscout.com) — On-chain analytics, live blocks & transactions
  - [DexScreener](https://dexscreener.com) — DEX token data
  - [Yahoo Finance](https://finance.yahoo.com) — Stock & crypto quotes + 24/7 market news (primary)
  - [Financial Modeling Prep](https://financialmodelingprep.com) — Stock & crypto quotes (fallback)
  - [LI.FI](https://li.quest) — Real on-chain swap quotes
  - [Robinhood Chain RPC](https://rpc.mainnet.chain.robinhood.com) — Live block number, balances
  - [DuckDuckGo](https://duckduckgo.com) — Web, image & video search
  - [YouTube](https://youtube.com) — Video search
  - [Wikipedia](https://wikipedia.org) — Knowledge graph
  - [OpenStreetMap](https://openstreetmap.org) — Maps & geocoding
  - [X/Twitter](https://x.com) — Social profiles & community data (page scrape + oembed + [unavatar.io](https://unavatar.io))
- **Package Manager:** pnpm

## Features

- **Real-time data 24/7** — Live market quotes, 24/7 stock news, on-chain blocks & transactions, auto-refreshing with staggered intervals
- **Stock Tokens** — 90+ 1:1-backed tokens (NVDA, AAPL, TSLA, QQQ, …) with real quotes and real on-chain swaps
- **Real on-chain dashboard** — Live blocks, live transactions, chain stats from Blockscout
- **Wallet support** — Connect / disconnect via MetaMask, WalletConnect, Coinbase (RainbowKit), real token balances
- **Dark/Light mode** — Toggle with 8 accent color themes + custom color picker
- **80 languages** — Full i18n with region-based filtering
- **PWA** — Installable as a standalone app on mobile and desktop
- **Responsive** — Mobile-first with hamburger nav, slide-over sidebar
- **Performance** — Critical-path rendering, lazy-loaded swap panel, CDN caching on hot APIs
- **Scroll-driven animations** — CSS `animation-timeline: view()` for scroll reveals
- **View Transitions API** — Smooth page transitions between routes
- **Glassmorphism** — Backdrop-blur header and card effects
- **Accessibility** — Skip-to-content, focus rings, reduced-motion support, screen reader classes

## Getting Started

```bash
# Clone
git clone https://github.com/kenGucci/rh-builders.git
cd rh-builders

# Install
pnpm install

# Configure environment
cp .env.example .env.local
# Add your API keys to .env.local

# Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `JWT_SECRET` | JWT signing secret |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |

## Social

- **Official X:** [@officialWALLrh](https://x.com/officialWALLrh)
- **Lead Developer:** [@suggestionii](https://x.com/suggestionii)
- **Live app:** [rh-builders.vercel.app](https://rh-builders.vercel.app)

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full project roadmap — from completed milestones to upcoming features.

## License

MIT
