import { Metadata } from "next";
import BuilderListClient from "@/components/BuilderListClient";
import builders from "@/lib/builders.json";

export const metadata: Metadata = {
  title: "Robinhood Chain (Beta) — Live Builders",
  description:
    "Live tracking of builders deploying new tokens on Robinhood Chain (Beta · Live). On-chain stats, deployer wallets, and X-connected builders on Chain ID 4663.",
};

export default function BuildersPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              Builders[Dev]
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[9px] font-bold text-green-400 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-blink" />
                Beta · Live
              </span>
            </h1>
            <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-blink" />
              Live · Tracking builders deploying new tokens on Robinhood
            </p>
          </div>
        </div>
      </div>

      <BuilderListClient builders={builders.builders} />
    </div>
  );
}
