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

THE WALL RH is a full-stack platform for **Robinhood Chain** — combining a real-time on-chain analytics dashboard with a **Stock Token marketplace**. Track builders, tokens, live market data, and real on-chain activity — all in one dark-mode dashboard with a polished UI. No login required — the entire site is open to browse.

## Pages

### Dashboard (`/`)
The landing page with a hero section, live network stats (transactions, blocks, addresses, block time), sparkline charts, top builder cards, stock token preview, latest live transactions, and crypto news.

### Builders (`/builder`)
Browse all builders on Robinhood Chain with aggregate stats (total addresses, transactions, ERC-20 tokens, network block). Search and filter, then open any address for a full profile.

### Builder Profile (`/builder/[address]`)
Deep-dive into any address: ETH/token balance, transaction count, token holdings table, balance history chart, live X/Twitter profile card, contract deployer info, and developer rewards panel with claim history.

### Market (`/market`)
The Stock Token marketplace — **96+ 1:1-backed Stock Tokens** (NVDA, AAPL, TSLA, QQQ, and more) with live logos, 24/7 quotes, gainers/losers/movers, watchlist, and detail modals.

- **Market News 24/7** — Latest headlines for the tokens behind Stock Tokens, pulled live from Yahoo Finance.
- **On X** — Live X profiles of the market voices moving the stock world (@robinhood, @CNBC, @MarketWatch, @WSJMarkets, @Stocktwits, @Nasdaq).
- **See what's onchain** — Real-time chain dashboard: live blocks, live transactions, chain stats from Blockscout, running 24/7.
- **Real swaps** — Connect your wallet (MetaMask / WalletConnect / Coinbase) to check balances, disconnect, and swap Stock Tokens directly on Robinhood Chain via LI.FI.
- **Real on-chain txns** — Live transactions verified on Blockscout.

### Stock Token (`/stock/[symbol]`)
A full page for any Stock Token — company profile, live quote and chart, market state, and Buy/Sell actions, with the official token logo from Robinhood's CDN.

### Token Profile (`/token/[address]`)
Live token profile for any token on Robinhood Chain — price, market cap, volume, and holder data from Blockscout (via the official Robinhood Chain API for Stock Tokens), plus its X account and chain links. Token logos resolve automatically (FMP → Blockscout → Stock Token catalog) with letter-avatar fallbacks.

### X Profile (`/x/[handle]`)
Any X/Twitter handle resolves to a live profile page — banner, avatar, description, follower counts, location, and join date, all fetched live from X.

### Profile (`/profile`)
Your wallet-connected portfolio: stock token holdings, their value in ETH/USD, live buy & sell history, and ETH balance. Connect with MetaMask / WalletConnect / Coinbase.

### Team (`/team`)
The official accounts behind THE WALL — the Official X account ([@officialWALLrh](https://x.com/officialWALLrh)) and the lead developer ([@suggestionii](https://x.com/suggestionii)) with live banner, avatar, bio, follower stats, and Follow buttons.

### About Us (`/about`)
Full site guide covering every page with "How to use" and "How it works" walkthroughs.

### Settings (`/settings`)
Language and theme configuration. Supports 80 languages with 15 fully translated (EN, ZH, ES, FR, DE, PT, AR, HI, JA, KO, RU, VI, TR, TH, ID). 8 preset accent colors plus a custom hex color picker with live preview. Terms, Privacy, and Cookies linked from here.

### Legal (`/legal/terms`, `/legal/privacy`, `/legal/cookies`)
Static legal reference pages.

## Architecture

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── page.tsx            # Dashboard landing
│   ├── about/              # About Us + site guide
│   ├── builder/            # Builder list + detail pages
│   ├── legal/              # Terms, Privacy, Cookies
│   ├── market/             # Stock Token marketplace + real-time on-chain dashboard
│   ├── profile/            # Wallet-connected portfolio
│   ├── settings/           # Language & theme settings
│   ├── stock/              # Stock Token detail pages
│   ├── team/               # Team + official X account
│   ├── token/              # Token profile pages
│   ├── x/                  # Live X profile pages
│   └── api/                # 31 API route handlers
├── components/             # Reusable UI components
├── lib/                    # Services, utilities, data
└── proxy.ts                # Middleware: rate limiting, CSP, cache headers
```

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React Server Components)
- **UI:** React 19, Tailwind CSS v4.3, Lucide icons, RainbowKit + wagmi (wallet), custom CSS animations
- **Backend:** Next.js API routes (serverless) + middleware (`src/proxy.ts`) with CDN caching and CSP
- **Database:** Supabase (PostgreSQL) — feedback + user-facing records
- **Rate Limiting:** Upstash Redis + Ratelimit (60 req/min per IP)
- **Data Sources:**
  - [Blockscout](https://robinhoodchain.blockscout.com) — On-chain analytics, token lists, creator/discovery, live blocks & transactions
  - [Robinhood Chain API (RHJ)](https://api.robinhood.com) — Official Stock Token registry (assets) + live bid/ask prices
  - [Yahoo Finance](https://finance.yahoo.com) — Stock & crypto quotes + 24/7 market news
  - [Financial Modeling Prep](https://financialmodelingprep.com) — Stock & crypto quotes (fallback)
  - [LI.FI](https://li.quest) — Real on-chain swap quotes
  - [Robinhood Chain RPC](https://rpc.mainnet.chain.robinhood.com) — Live block number, balances
  - [Robinhood CDN](https://cdn.robinhood.com) — Official Stock Token logos
  - [X/Twitter](https://x.com) — Live social profiles (scrape + oembed + [unavatar.io](https://unavatar.io))
- **Package Manager:** pnpm

## Features

- **Real-time data 24/7** — Live market quotes, 24/7 stock news, on-chain blocks & transactions, auto-refreshing with staggered intervals
- **Stock Tokens** — 96+ 1:1-backed tokens (NVDA, AAPL, TSLA, QQQ, …) with real quotes, official logos, and real on-chain swaps
- **Live token logos** — Automatic logo resolution (FMP → Blockscout → stock catalog) with letter-avatar fallbacks
- **Real on-chain dashboard** — Live blocks, live transactions, chain stats from Blockscout
- **Wallet support** — Connect / disconnect via MetaMask, WalletConnect, Coinbase (RainbowKit), real token balances
- **Open platform** — No login gate; everything browsable without an account
- **Dark/Light mode** — Toggle with 8 accent color themes + custom color picker
- **80 languages** — Full i18n with region-based filtering
- **PWA** — Installable as a standalone app on mobile and desktop
- **Responsive** — Mobile-first with hamburger nav, slide-over sidebar
- **Performance** — Critical-path rendering, lazy-loaded swap panel, CDN caching on hot APIs
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
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `RPC_URL` | Robinhood Chain RPC endpoint (Chain ID 4663) |
| `FMP_API_KEY` | Financial Modeling Prep API key (live market data) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (rate limiting, optional) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (rate limiting, optional) |

## Social

- **Official X:** [@officialWALLrh](https://x.com/officialWALLrh)
- **Lead Developer:** [@suggestionii](https://x.com/suggestionii)
- **Live app:** [rh-builders.vercel.app](https://rh-builders.vercel.app)

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full project roadmap — from completed milestones to upcoming features.

## Whitepaper

See [WHITEPAPER.md](WHITEPAPER.md) for the product deep-dive.

## License

MIT
