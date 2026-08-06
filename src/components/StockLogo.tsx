"use client";

import { useState } from "react";

const FALLBACK_SOURCES = [
  "https://assets.parqet.com/logos/symbol/",
  "https://financialmodelingprep.com/image-stock/",
];

export default function StockLogo({
  symbol,
  logo,
  size = 40,
  className = "",
}: {
  symbol: string;
  logo?: string;
  size?: number;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  const s = symbol.toUpperCase();
  const sources = [
    `/api/logo/${s}`,
    ...(logo ? [logo] : []),
    ...FALLBACK_SOURCES.map((b) => `${b}${s}`),
  ];

  if (idx >= sources.length) {
    return (
      <div
        className={`rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 border border-[var(--accent)]/20 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-sm font-bold text-[var(--accent)]">{s}</span>
      </div>
    );
  }

  return (
    <img
      src={sources[idx]}
      alt={s}
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setIdx((i) => i + 1)}
      className={`rounded-xl object-contain bg-[var(--bg-card)]/60 border border-[var(--border-subtle)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
