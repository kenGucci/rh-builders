"use client";

import Link from "next/link";
import {
  LayoutDashboard, Users, LineChart, Search, Settings2, Info,
  ArrowRight, Activity, Sparkles, Wallet, Shield, Zap, Globe, Layers, Database,
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
    icon: LayoutDashboard,
    description:
      "Your starting point. Scan live network stats, watch sparklines, spot top builders, and read the latest crypto news. The global search bar sits right at the top — type a wallet, token, or handle to jump anywhere.",
  },
  {
    href: "/builder",
    title: "Builders",
    icon: Users,
    description:
      "Browse the full builder list. Sort by activity, filter by tag or category, and search by wallet address, ENS, token contract, or X handle. Click any builder to open their full profile.",
  },
  {
    href: "/builder/[address]",
    title: "Builder Profile",
    icon: Layers,
    description:
      "Deep-dive into any address: ETH and token balances, transaction history, token holdings with DEX data, X/Twitter profile card, developer rewards, and contract deployer info.",
  },
  {
    href: "/market",
    title: "Market",
    icon: LineChart,
    description:
      "Watch stock and crypto quotes, build a watchlist, and track gainers, losers, and top movers. Use the built-in swap panel to trade Stock Tokens on-chain from your connected wallet.",
  },
  {
    href: "/global",
    title: "Global Search",
    icon: Search,
    description:
      "A full search engine in your sidebar. Switch between web, news, images, videos, and maps results — search history is saved locally on your device.",
  },
  {
    href: "/settings",
    title: "Settings",
    icon: Settings2,
    description:
      "Make THE WALL yours. Switch between 82 languages, pick one of 8 accent themes or drop in a custom color, and toggle dark/light mode.",
  },
  {
    href: "/team",
    title: "Team",
    icon: Info,
    description:
      "Meet the people behind THE WALL, with live X/Twitter data pulled straight from the team profile.",
  },
  {
    href: "/auth",
    title: "Auth",
    icon: Shield,
    description:
      "Sign in securely with email OTP, password, or X/Twitter OAuth. Sessions are protected with PBKDF2 hashing and JWT tokens.",
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

      {/* Why it exists */}
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

      {/* How to use — pages */}
      <section aria-label="How to use">
        <h2 className="text-xl font-bold mb-1">How to use THE WALL</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          Here is a quick tour of every page in the sidebar and what you can do on it.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent)]/25 hover:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-200"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                  <p.icon size={14} className="text-[var(--accent)]" />
                </div>
                <div className="text-sm font-semibold group-hover:text-[var(--accent)] transition-colors">
                  {p.title}
                </div>
                <ArrowRight size={13} className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{p.description}</p>
            </Link>
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
