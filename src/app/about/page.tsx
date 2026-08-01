"use client";

import Link from "next/link";
import {
  LayoutDashboard, Users, LineChart, Search, Settings2, Info,
  ArrowRight, Activity, Sparkles, Wallet, Shield, Zap, Globe, Layers, Database,
  Palette, Rocket, RefreshCw, MousePointerClick, Boxes,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Live Network Stats",
    description:
      "Real-time Robinhood Chain metrics — transactions, blocks, addresses, and block time — refreshed automatically as the network moves.",
  },
  {
    icon: Users,
    title: "Builder Directory",
    description:
      "Every builder and launchpad on chain with token holdings, balance history, X profiles, and contract deployer information.",
  },
  {
    icon: LineChart,
    title: "Market Data",
    description:
      "Live stock and crypto quotes powered by Financial Modeling Prep and Yahoo Finance, plus a real on-chain swap panel.",
  },
  {
    icon: Wallet,
    title: "Reward Tracking",
    description:
      "Creator reward claims per token — claimed amount, claim count, and last claim — so you never miss what builders are earning.",
  },
  {
    icon: Search,
    title: "Global Search",
    description:
      "One search box for the whole web: news, images, videos, and maps via DuckDuckGo, YouTube, Wikipedia, and OpenStreetMap.",
  },
  {
    icon: Shield,
    title: "On-Chain Transparency",
    description:
      "Everything is verifiable — every number links back to Blockscout, the canonical explorer for Robinhood Chain.",
  },
];

const pages = [
  {
    href: "/",
    title: "Dashboard",
    badge: "Home",
    icon: LayoutDashboard,
    summary:
      "The command center of THE WALL. The Dashboard shows you the health and activity of the entire Robinhood Chain at a glance.",
    howToUse: [
      "Scan the four live stat cards: Transactions, Blocks, Addresses, and Block Time — each with a sparkline of recent history.",
      "Read the ticker bar for ETH price, today's transactions, and current gas in Gwei.",
      "Browse Top on-chain builders and click any card to jump straight into their profile.",
      "Watch the live transaction feed at the bottom and read the latest crypto news.",
      "Use the global search bar at the top to jump to any wallet, token, or handle instantly.",
    ],
    howItWorks:
      "The page polls /api/chain-stats every 15 seconds for real-time metrics from Blockscout, keeps a rolling history for the sparklines, and streams recent transactions and news through dedicated live components.",
  },
  {
    href: "/global",
    title: "Global Search",
    badge: "Search Engine",
    icon: Search,
    summary:
      "A complete search engine built into the app. Search the open web, news, images, videos, and maps without ever leaving the site.",
    howToUse: [
      "Type any query into the search box — it auto-focuses when the page loads.",
      "Switch between Web, News, Images, Videos, and Maps tabs to change the result type.",
      "Click a suggestion chip to run a curated search instantly.",
      "Your last 10 searches are saved locally on your device for quick re-runs.",
    ],
    howItWorks:
      "Each search is routed through the /api/global endpoint, which fans out to DuckDuckGo (web, images, news), YouTube (videos), Wikipedia (knowledge), and OpenStreetMap (maps), then merges the results into one clean list.",
  },
  {
    href: "/builder",
    title: "Builders[Dev]",
    badge: "Core",
    icon: Rocket,
    summary:
      "The builder hub. See top trending coins by volume and market cap on Robinhood Chain, then browse the full directory of builders, launchpads, and contracts.",
    howToUse: [
      "Start with the trending coins grid — live DEX data on volume, price changes, and market cap.",
      "Scroll the full builder list and sort it, filter by tag or category, and search by wallet address, ENS, token contract, or X handle.",
      "Click any builder to open their full profile page and dig into their activity.",
      "Spot launchpads and deployed tech from the overview panels at the top.",
    ],
    howItWorks:
      "Builder data is served from a local curated registry plus live enrichment from Blockscout for on-chain stats and DexScreener for DEX pairs and liquidity. Every card links back to the verified on-chain record.",
  },
  {
    href: "/market",
    title: "Market",
    badge: "Trading",
    icon: LineChart,
    summary:
      "Live stock and crypto market data, plus a real on-chain swap panel. Trade Stock Tokens backed by Robinhood Custody right from your wallet.",
    howToUse: [
      "Browse 90+ Stock Tokens (NVDA, AAPL, QQQ, and more) and crypto pairs with live quotes.",
      "Build a watchlist, then sort by Gainers, Losers, or Top Movers.",
      "Open any asset for a detail modal with sparkline, volume, and market state (open / pre / after / closed).",
      "Connect your wallet and use the built-in Swap panel to trade tokens on-chain.",
    ],
    howItWorks:
      "Quotes stream from Yahoo Finance as the primary source with Financial Modeling Prep as fallback. Stock Token metadata comes from the /api/stock-tokens endpoint, and swaps execute through LI.FI on Robinhood Chain.",
  },
  {
    href: "/team",
    title: "Team",
    badge: "People",
    icon: Users,
    summary:
      "Meet the people behind THE WALL, with their profile and live X/Twitter data pulled straight from the network.",
    howToUse: [
      "See the team banner, avatar, bio, and follower stats.",
      "Use the Follow on X button to keep up with the team's updates.",
      "Click through the profile links, location, and join date for context.",
    ],
    howItWorks:
      "The page fetches the live X/Twitter profile via the /api/twitter endpoint (page scrape + oembed) and renders the account's real banner, avatar, description, and stats.",
  },
  {
    href: "/settings",
    title: "Settings",
    badge: "Customize",
    icon: Settings2,
    summary:
      "Make THE WALL yours — language, theme, and feedback all in one place.",
    howToUse: [
      "Switch the interface language from a list of 82 supported languages, or let region-based filtering suggest the right one.",
      "Toggle dark / light mode.",
      "Send feedback on any page with a good / bad rating to help shape the product.",
    ],
    howItWorks:
      "Settings are persisted locally and applied instantly. Language is managed through the i18n provider, and feedback is stored in the Supabase-backed /api/feedback endpoint.",
  },
  {
    href: "/settings",
    title: "Theme",
    badge: "Customize",
    icon: Palette,
    summary:
      "Pick one of 8 preset accent colors — or drop in your own custom color — and restyle the whole app in real time.",
    howToUse: [
      "Choose a preset: Green, Red, Blue, Yellow, Purple, Black, Cyan, or Pink.",
      "Use the color picker to enter any custom hex and watch the live preview update.",
      "Toggle between dark and light mode to see your accent on both.",
    ],
    howItWorks:
      "The selected accent is written to CSS variables (--accent, --accent-glow, gradient colors) on the document root, so every component restyles instantly without a page reload.",
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
            real-world assets on-chain. We track every builder, token launch, reward claim, and DEX
            move, and surface it in one clean dashboard.
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
            How to use each page in the sidebar — and how it works under the hood.
          </p>
        </div>

        <div className="space-y-6">
          {pages.map((p, i) => (
            <article
              key={p.href + p.title}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl overflow-hidden"
            >
              <header className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                    <p.icon size={18} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{p.title}</h3>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-medium uppercase tracking-wider">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {i + 1} of {pages.length} · {p.href}
                    </p>
                  </div>
                  <Link
                    href={p.href}
                    className="ml-auto hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-black text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Open page <ArrowRight size={12} />
                  </Link>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">
                  {p.summary}
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
                    {p.howToUse.map((step) => (
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
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{p.howItWorks}</p>
                </div>
              </div>

              <div className="px-6 pb-6 md:hidden">
                <Link
                  href={p.href}
                  className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl bg-[var(--accent)] text-black text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Open page <ArrowRight size={12} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Data sources */}
      <section aria-label="Data sources">
        <h2 className="text-xl font-bold mb-4">Where the data comes from</h2>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database size={15} className="text-[var(--accent)]" />
            <span className="text-sm font-semibold">Powered by</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-2"><Globe size={12} className="text-[var(--accent)]" /> Blockscout — on-chain data</span>
            <span className="flex items-center gap-2"><LineChart size={12} className="text-[var(--accent)]" /> DexScreener — DEX pairs & volume</span>
            <span className="flex items-center gap-2"><Zap size={12} className="text-[var(--accent)]" /> Yahoo Finance + FMP — quotes</span>
            <span className="flex items-center gap-2"><Search size={12} className="text-[var(--accent)]" /> DuckDuckGo / YouTube / OSM — search</span>
            <span className="flex items-center gap-2"><Globe size={12} className="text-[var(--accent)]" /> X / Twitter — profiles & KOLs</span>
            <span className="flex items-center gap-2"><Shield size={12} className="text-[var(--accent)]" /> Supabase — accounts & sessions</span>
          </div>
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
