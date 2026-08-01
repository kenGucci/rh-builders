"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import HeaderSearch from "@/components/HeaderSearch";
import { Menu, ExternalLink } from "lucide-react";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 overflow-y-auto min-w-0">
        <header
          className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg)]/80 backdrop-blur-xl no-print"
          role="banner"
          aria-label="THE WALL application header"
        >
          <div className="px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-xl hover:bg-[var(--bg-card)] transition-colors text-[var(--text-secondary)]"
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
              >
                <Menu size={18} aria-hidden="true" />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]" role="status" aria-label="Connected to Robinhood Chain, Chain ID 4663">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] pulse-dot" aria-hidden="true" />
                <span className="font-medium">Robinhood Chain</span>
                <span className="text-[var(--text-muted)]/50">·</span>
                <span className="text-[var(--accent)] font-mono">4663</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <HeaderSearch className="hidden md:block" />
              <nav className="flex items-center gap-2" aria-label="Actions">
                <ThemeSwitcher compact />
                <a
                  href="https://robinhoodchain.blockscout.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/20 transition-all font-medium"
                  aria-label="Open Robinhood Chain Blockscout Explorer in a new tab"
                >
                  Explorer
                  <ExternalLink size={10} aria-hidden="true" />
                </a>
              </nav>
            </div>
          </div>
        </header>
        <main className="p-3 sm:p-4 md:p-6" role="main" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
