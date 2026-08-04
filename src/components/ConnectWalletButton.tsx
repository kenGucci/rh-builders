"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";

export default function ConnectWalletButton({ compact }: { compact?: boolean }) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === "authenticated");

        if (!ready) {
          return (
            <div className="w-9 h-9 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] animate-shimmer" />
          );
        }

        if (connected) {
          if (compact) {
            return (
              <button
                onClick={openAccountModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)] hover:border-[var(--accent)]/30 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-green-400" />
                {account.displayName}
              </button>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <button
                onClick={openChainModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent)]/30 transition-all"
              >
                {chain.hasIcon && (
                  <div className="w-4 h-4 rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
                    {chain.iconUrl && (
                      <Image alt={chain.name ?? "Chain icon"} className="w-3 h-3" src={chain.iconUrl} width={12} height={12} unoptimized />
                    )}
                  </div>
                )}
                {chain.name}
              </button>

              <button
                onClick={openAccountModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all group"
              >
                <span className="w-2 h-2 rounded-full bg-green-400 live-blink" />
                <span className="text-xs font-semibold text-[var(--foreground)]">{account.displayName}</span>
                {account.balanceDecimals && (
                  <span className="text-[10px] text-[var(--text-muted)] hidden sm:block">
                    {parseFloat(account.balanceFormatted ?? "0").toFixed(4)} ETH
                  </span>
                )}
              </button>
            </div>
          );
        }

        return (
          <button
            onClick={openConnectModal}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent)] to-[var(--gradient-to)] rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity" />
            <div className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-xs font-semibold text-white hover:opacity-90 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Connect Wallet
            </div>
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
