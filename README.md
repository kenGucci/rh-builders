# THE WALL RH

> Real-time builder analytics dashboard for [Robinhood Chain](https://robinhoodchain.blockscout.com) (Chain ID 4663)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06b6d4?logo=tailwindcss)

---

## What is THE WALL RH?

THE WALL RH is a full-stack on-chain analytics platform for **Robinhood Chain**. It tracks builders, tokens, KOLs, market data, and live DEX activity — all in one dark-mode dashboard with a polished UI.

## Pages

### Dashboard (`/`)
The landing page with a hero section, live network stats (transactions, blocks, addresses, block time), sparkline charts, top builder cards, and latest crypto news. Includes a global search bar th[...]

### Global Search (`/global`)
A multi-category search engine powered by DuckDuckGo, YouTube, OpenStreetMap, and Wikipedia. Supports web, news, images, videos, and maps results with full-text search history saved in localStorag[...]

### Builders (`/builder`)
Browse all builders on Robinhood Chain with aggregate stats (total addresses, transactions, ERC-20 tokens, network block). Shows trending launchpads, deployed tech overview, DexScreener token grid[...]

### Builder Profile (`/builder/[address]`)
Deep-dive into any address: ETH/token balance, transaction count, token holdings table, balance history chart, X/Twitter profile card, contract deployer info, and developer rewards panel with clai[...]

### Market (`/market`)
Live stock and crypto market data powered by Financial Modeling Prep. Watchlist, gainers, losers, and top movers with sparkline charts, market state badges (open/pre/after/closed), and detail moda[...]

### KOL Hub (`/kol`)
Top 50 ranked Key Opinion Leaders leaderboard with podium display for top 3, PnL badges, follower counts, on-chain activity stats. Expandable detail panels with X profile, transaction history, and[...]

### Team (`/team`)
Team profile page pulling live X/Twitter data for @suggestionii with banner, avatar, bio, follower stats, and social links.

### Settings (`/settings`)
Language and theme configuration. Supports 82 languages with 12 fully translated (EN, ZH, ES, FR, DE, PT, AR, HI, JA, KO, RU, VI). 8 preset accent colors plus a custom hex color picker with live p[...]

### Auth (`/auth`)
Authentication via three methods: OTP email verification (6-digit code with auto-submit), password login, or X/Twitter OAuth 2.0. Secured with PBKDF2 hashing, JWT tokens, and OAuth PKCE.

## Architecture

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── page.tsx            # Dashboard landing
│   ├── auth/               # Authentication
│   ├── builder/            # Builder list + detail pages
│   ├── global/             # Global search engine
│   ├── kol/                # KOL leaderboard
│   ├── market/             # Stock & crypto market data
│   ├── settings/           # Language & theme settings
│   ├── team/               # Team profile
│   └── api/                # 30 API route handlers
├── components/             # Reusable UI components
├── lib/                    # Services, utilities, data
└── types/                  # TypeScript declarations
```

## Tech Stack

- **Framework:** Next.js 15 (App Router, React Server Components)
- **UI:** React 19, Tailwind CSS v4, custom CSS animations (scroll-driven, glassmorphism, view transitions)
- **Backend:** Next.js API routes (serverless)
- **Database:** Supabase (PostgreSQL)
- **Auth:** JWT (jose), OTP email, X/Twitter OAuth 2.0 PKCE
- **Data Sources:**
  - [Blockscout](https://robinhoodchain.blockscout.com) — On-chain analytics
  - [DexScreener](https://dexscreener.com) — DEX token data
  - [Financial Modeling Prep](https://financialmodelingprep.com) — Stock & crypto quotes
  - [DuckDuckGo](https://duckduckgo.com) — Web search
  - [X/Twitter](https://x.com) — Social profiles & KOL data
- **Package Manager:** pnpm

## Features

- **Real-time data** — Auto-refreshing network stats, DEX activity, and market quotes
- **Dark/Light mode** — Toggle with 8 accent color themes + custom color picker
- **82 languages** — Full i18n with region-based filtering
- **PWA** — Installable as a standalone app on mobile and desktop
- **Responsive** — Mobile-first with hamburger nav, slide-over sidebar
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

| `PEXELS_API_KEY` | Pexels API key |
| `X_RAPIDAPI_KEY` | RapidAPI key for X/Twitter data |

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full project roadmap — from completed milestones to upcoming features.

## License

MIT
