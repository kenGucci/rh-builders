"use client";

import Link from "next/link";
import {
  LayoutDashboard, Users, LineChart, Settings2, Info,
  ArrowRight, Activity, Sparkles, Wallet,
  Rocket, RefreshCw, MousePointerClick, Boxes,
  Coins, Layers, AtSign, FileText, Search, User,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Live Network Stats",
    description:
      "Real-time Robinhood Chain metrics — transactions, blocks, addresses, and block time — refreshed every few seconds as the network moves.",
  },
  {
    icon: Users,
    title: "Builder Directory",
    description:
      "Every builder and launchpad on chain with token holdings, balance history, X profiles, and contract deployer information.",
  },
  {
    icon: LineChart,
    title: "Market Data & News",
    description:
      "Live stock and crypto quotes, interactive charts, and 24/7 market news for the stocks behind Stock Tokens.",
  },
  {
    icon: Coins,
    title: "Stock Token Trading",
    description:
      "90+ 1:1-backed Stock Tokens — buy and sell NVDA, AAPL, QQQ and more with real on-chain trades straight from your wallet.",
  },
  {
    icon: Wallet,
    title: "Wallet-Linked Profile",
    description:
      "Connect your wallet to see your live portfolio — holdings, value in ETH and USD, and your full buy & sell history.",
  },
];

interface PageGuide {
  href: string;
  title: string;
  badge: string;
  icon: React.ElementType;
  summary: string;
  howToUse: string[];
  howItWorks: string;
}

const pages: PageGuide[] = [
  {
    href: "/",
    title: "Dashboard",
    badge: "Home",
    icon: LayoutDashboard,
    summary:
      "The command center of THE WALL. The Dashboard shows the health and activity of the entire Robinhood Chain at a glance — with a universal search bar and a real Invest with Stock Tokens section.",
    howToUse: [
      "Use the search bar to look up any wallet (0x…), contract address (CA), X handle (@…), or Stock Token — results route straight to the matching profile.",
      "Read the four live stat cards: Transactions, Blocks, Addresses, and Block Time — each with a sparkline of recent history.",
      "Check the ticker bar for ETH price, today's transactions, and current gas in Gwei.",
      "Invest with Stock Tokens: browse all 90+ Stock Tokens with live prices, real stock charts, and Buy/Sell buttons that execute real on-chain trades from your wallet.",
      "Browse Top on-chain builders and click any card to jump straight into their profile.",
      "Watch the live transaction feed at the bottom and read the latest crypto news.",
    ],
    howItWorks:
      "The page polls /api/chain-stats every 15 seconds for real-time metrics from Blockscout, keeps a rolling history for the sparklines, and streams recent transactions and news through dedicated live components. Search resolves against /api/search. The Stock Tokens section fetches live quotes and historical chart data from /api/market and executes buys and sells on-chain via LI.FI.",
  },
  {
    href: "/profile",
    title: "Profile",
    badge: "Core",
    icon: User,
    summary:
      "Your wallet-linked hub. Connect a wallet to see your live portfolio — holdings, portfolio value, trade history, and ETH balance.",
    howToUse: [
      "Connect your wallet (MetaMask, WalletConnect, or Coinbase) to load your live portfolio.",
      "Review your holdings with live prices and USD/ETH value, plus your full buy & sell history.",
      "Refresh to re-pull balances at any time, or disconnect your wallet from the profile header.",
    ],
    howItWorks:
      "The page uses wagmi for wallet connection and /api/profile for on-chain holdings and trade history from Blockscout. Portfolio data refreshes every 20 seconds.",
  },
  {
    href: "/builder",
    title: "Builders[Dev]",
    badge: "Core",
    icon: Rocket,
    summary:
      "The builder hub. Search the directory, see top trending coins by volume and market cap on Robinhood Chain, then browse the full list of builders, launchpads, and contracts.",
    howToUse: [
      "Use the search bar to filter the developer list by name, X handle, wallet, or contract address.",
      "Start with the trending coins grid — live DEX data on volume, price changes, and market cap.",
      "Scroll the full builder list and sort it by activity, balance, or last seen — or filter by tag and category.",
      "Click any builder to open their full profile page and dig into their activity.",
      "Spot launchpads and deployed tech from the overview panels at the top.",
    ],
    howItWorks:
      "Builder data is auto-discovered on-chain from Blockscout (token creators/deployers) plus live enrichment for on-chain stats, alongside the curated local registry. Every card links back to the verified on-chain record.",
  },
  {
    href: "/market",
    title: "Market",
    badge: "Trading",
    icon: LineChart,
    summary:
      "Live stock and crypto market data, 24/7 news, plus a real on-chain swap panel. Track all 96+ Stock Tokens backed by Robinhood Custody and trade right from your wallet.",
    howToUse: [
      "Use the symbol search to jump instantly to any Stock Token (NVDA, AAPL, QQQ, and more) or crypto pair.",
      "Browse the 96+ Stock Tokens with live quotes and real interactive stock charts, and build a watchlist.",
      "Click Buy or Sell on any Stock Token to open the trade modal — it fetches a live LI.FI quote and executes a real on-chain transaction from your wallet.",
      "Sort by Gainers, Losers, or Top Movers to follow the action, and open any asset for a detail view with sparkline, volume, and market state.",
      "Connect your wallet and use the built-in Swap panel to trade tokens on-chain.",
      "Follow the 24/7 market news feed and the live X profiles of the market voices moving the stock world.",
    ],
    howItWorks:
      "Quotes stream in live from the market API, historical chart data comes from Yahoo Finance OHLCV, Stock Token metadata from /api/stock-tokens, and swaps execute through LI.FI on Robinhood Chain. Live blocks, transactions, and chain stats run 24/7 from Blockscout.",
  },
  {
    href: "/team",
    title: "Community",
    badge: "People",
    icon: Users,
    summary:
      "The official accounts behind THE WALL — the Official X account (@officialWALLrh) and the official GitHub builder, kenGucci.",
    howToUse: [
      "See the Official X account with its real banner, avatar, location, website, and join date.",
      "Use the Follow on X button to keep up with announcements.",
      "Visit the Official Builder card and click Follow on GitHub to track every project, commit, and release at github.com/kenGucci.",
    ],
    howItWorks:
      "The page fetches the live X/Twitter profile via the /api/twitter endpoint and renders the account's real banner, avatar, and details. The Official Builder links directly to github.com/kenGucci.",
  },
  {
    href: "/settings",
    title: "Settings",
    badge: "Customize",
    icon: Settings2,
    summary:
      "Make THE WALL yours — language, theme, and feedback all in one place, with the Terms of Use, Privacy Policy, and Cookie Policy one click away.",
    howToUse: [
      "Switch the interface language from 80 supported languages, or let region-based filtering suggest the right one.",
      "Toggle dark / light mode.",
      "Pick one of 8 preset accent colors — or enter a custom hex and watch the whole app restyle live.",
      "Send feedback on any page with a good / bad rating to help shape the product.",
      "Read the Terms of Use, Privacy Policy, and Cookie Policy.",
    ],
    howItWorks:
      "Settings persist locally and apply instantly. Language is managed through the i18n provider, themes write CSS variables to the document root, feedback is stored in the Supabase-backed /api/feedback endpoint, and legal pages are served as static routes.",
  },
  {
    href: "/about",
    title: "About Us",
    badge: "Info",
    icon: Info,
    summary:
      "You are here. This page explains what THE WALL is, the features it offers, and how to use every page in the app.",
    howToUse: [
      "Read the overview to understand what THE WALL tracks and why.",
      "Browse the feature cards to discover what the platform can do.",
      "Use the page-by-page guide below to learn how each page works and what it is for.",
    ],
    howItWorks:
      "A static, always-available reference page — no live data required, so it loads instantly from anywhere.",
  },
];

const morePages: PageGuide[] = [
  {
    href: "/builder",
    title: "Builder Profile",
    badge: "Detail",
    icon: Search,
    summary:
      "A deep-dive into any address — ETH and token balance, transaction count, token holdings, balance history, X profile, contract deployer info, and developer rewards with claim history.",
    howToUse: [
      "Open any builder card from the Dashboard or the Builder directory.",
      "Review on-chain stats, holdings, and the balance history chart.",
      "See their X profile, developer rewards, and reward claim history.",
    ],
    howItWorks:
      "On-chain stats are enriched live from Blockscout, and social data comes from the /api/twitter endpoint.",
  },
  {
    href: "/market",
    title: "Stock Token",
    badge: "Detail",
    icon: Coins,
    summary:
      "A full page for any Stock Token — company profile, live quote and chart, market state, and Buy/Sell actions.",
    howToUse: [
      "Open any Stock Token from the Market page.",
      "Read the company profile, live quote, and interactive chart.",
      "Buy or sell directly from the page with a real on-chain transaction.",
    ],
    howItWorks:
      "Live quotes stream from the market API, historical chart data comes from Yahoo Finance OHLCV, and trades execute on-chain via LI.FI.",
  },
  {
    href: "/market",
    title: "Token Profile",
    badge: "Detail",
    icon: Layers,
    summary:
      "Live token profile for any token on Robinhood Chain — price, market cap, volume, and holder data from Blockscout, plus its X account and chain links.",
    howToUse: [
      "Open any token from the trending grid or a builder's holdings.",
      "Review price, market cap, volume, and holder stats.",
      "See the token's X account and view it on Blockscout.",
    ],
    howItWorks:
      "Price and holder data streams live from Blockscout, and social data comes from the /api/twitter endpoint.",
  },
  {
    href: "/team",
    title: "X Profile",
    badge: "Detail",
    icon: AtSign,
    summary:
      "Any X handle resolves to a live profile page — banner, avatar, description, follower counts, location, and join date, all fetched live from X.",
    howToUse: [
      "Search or click any X handle anywhere on the site.",
      "View the live profile details and jump to x.com for the full account.",
    ],
    howItWorks:
      "The page fetches the live X/Twitter profile via the /api/twitter endpoint and renders the account's real banner, avatar, and details.",
  },
  {
    href: "/legal/terms",
    title: "Legal",
    badge: "Info",
    icon: FileText,
    summary:
      "Terms of Use, Privacy Policy, and Cookie Policy — always available, linked from Settings and the cookie consent banner.",
    howToUse: [
      "Open any legal page from Settings or the cookie banner.",
      "Read how data is handled, how accounts work, and what cookies the site uses.",
    ],
    howItWorks:
      "Static, always-available reference pages served from the app using a shared LegalPage layout — no live data required.",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-8 fade-in max-w-5xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--accent)]/5 border border-[var(--border)] p-8 sm:p-10">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[var(--accent)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
              <Sparkles size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-medium uppercase tracking-wider">
              About Us
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            What is <span className="gradient-text">THE WALL</span>?
          </h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl">
            THE WALL is a real-time analytics platform for the Robinhood Chain (Chain ID 4663) —
            the permissionless, Ethereum-compatible Layer-2 network that brings stocks, crypto, and
            real-world assets on-chain. We track every builder, token launch, reward claim, Stock
            Token, and DEX move — and surface it in one clean dashboard.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/builder"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Explore Builders <ArrowRight size={14} />
            </Link>
            <Link
              href="/market"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]/30 transition-colors"
            >
              View Market <LineChart size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Who it is for */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "For builders",
            description:
              "Launch a token, get discovered. Every deployment, reward claim, and holder transaction is on your public profile.",
          },
          {
            title: "For traders",
            description:
              "Follow the money. Watch DEX volumes, price changes, and Stock Token markets, then swap on-chain from your wallet.",
          },
          {
            title: "For researchers",
            description:
              "Go deep. Every stat links back to Blockscout so any number on the site can be verified on-chain.",
          },
        ].map((c) => (
          <div key={c.title} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">
              {c.title}
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{c.description}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <section aria-label="Features">
        <h2 className="text-xl font-bold mb-4">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent)]/25 hover:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-3">
                <f.icon size={16} className="text-[var(--accent)]" />
              </div>
              <div className="text-sm font-semibold mb-1">{f.title}</div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Explore every page */}
      <section aria-label="Explore every page">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-[var(--accent)] mb-2">
            <Boxes size={12} />
            Site Guide
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Explore every page</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1.5">
            How to use each page in the app — and how it works under the hood.
          </p>
        </div>

        {/* Main pages */}
        <div className="mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Main Pages
          </span>
        </div>
        <div className="space-y-6 mb-10">
          {pages.map((p, i) => (
            <PageCard key={p.href + p.title} page={p} index={i} total={pages.length + morePages.length} />
          ))}
        </div>

        {/* More pages */}
        <div className="mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            More Pages
          </span>
        </div>
        <div className="space-y-6">
          {morePages.map((p, i) => (
            <PageCard key={p.href + p.title} page={p} index={pages.length + i} total={pages.length + morePages.length} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-3xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-8 text-center">
        <h2 className="text-lg font-bold mb-1">Ready to see the network?</h2>
        <p className="text-xs text-[var(--text-muted)] mb-5">
          Start on the Dashboard, then dig into a builder profile. Everything updates live.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent)] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Go to Dashboard <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function PageCard({
  page,
  index,
  total,
}: {
  page: PageGuide;
  index: number;
  total: number;
}) {
  return (
    <article
      className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl overflow-hidden"
    >
      <header className="p-6 pb-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
            <page.icon size={18} className="text-[var(--accent)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{page.title}</h3>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-medium uppercase tracking-wider">
                {page.badge}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {index + 1} of {total} · {page.href}
            </p>
          </div>
          <Link
            href={page.href}
            className="ml-auto hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-black text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Open page <ArrowRight size={12} />
          </Link>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">
          {page.summary}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <MousePointerClick size={14} className="text-[var(--accent)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              How to use
            </span>
          </div>
          <ul className="space-y-2.5">
            {page.howToUse.map((step) => (
              <li key={step} className="flex items-start gap-2.5 text-xs text-[var(--text-muted)] leading-relaxed">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                {step}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={14} className="text-[var(--accent)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              How it works
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">{page.howItWorks}</p>
        </div>
      </div>

      <div className="px-6 pb-6 md:hidden">
        <Link
          href={page.href}
          className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl bg-[var(--accent)] text-black text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Open page <ArrowRight size={12} />
        </Link>
      </div>
    </article>
  );
}
