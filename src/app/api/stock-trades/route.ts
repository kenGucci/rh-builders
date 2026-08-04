import { NextRequest, NextResponse } from "next/server";
import { STOCK_TOKENS } from "@/lib/stock-tokens";
import { v2Fetch } from "@/lib/blockscout";

const PER_TOKEN_TTL_MS = 60_000;
const SWR_MS = 45_000;
const perTokenCache = new Map<string, { value: unknown; expires: number }>();

interface StockTrade {
  symbol: string;
  name: string;
  tokenAddress: string;
  side: "buy" | "sell";
  from: string;
  to: string;
  amount: string;
  decimals: number;
  timestamp: string;
  txHash: string;
  method: string;
}

interface SweepResult {
  trades: StockTrade[];
  updatedAt: string;
}

let sweepCache: { data: SweepResult; ts: number } | null = null;
let sweeping: Promise<void> | null = null;

function short(a: string): string {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function cacheGet(key: string) {
  const e = perTokenCache.get(key);
  if (!e) return null;
  if (Date.now() > e.expires) {
    perTokenCache.delete(key);
    return null;
  }
  return e.value;
}

function cacheSet(key: string, value: unknown) {
  perTokenCache.set(key, { value, expires: Date.now() + PER_TOKEN_TTL_MS });
  if (perTokenCache.size > 300) {
    const now = Date.now();
    for (const [k, v] of perTokenCache) if (now > v.expires) perTokenCache.delete(k);
  }
}

async function fetchTransfers(token: { symbol: string; name: string; tokenAddress: string }): Promise<StockTrade[]> {
  try {
    const key = `tx:${token.tokenAddress}`;
    const cached = cacheGet(key);
    if (cached) return cached as StockTrade[];
    const data = await v2Fetch(`/tokens/${token.tokenAddress.toLowerCase()}/transfers`, 60_000, 1) as Record<string, unknown>;
    const items: Record<string, unknown>[] = Array.isArray(data) ? data : (data.items as Record<string, unknown>[]) || [];

    const trades: StockTrade[] = [];
    for (const it of items.slice(0, 15)) {
      const from = (it.from as Record<string, string>) || {};
      const to = (it.to as Record<string, string>) || {};
      const total = (it.total as Record<string, string>) || {};
      const amount = typeof total.value === "string" ? total.value : "0";
      const decimals = Number(total.decimals || 18);
      if (BigInt(amount || "0") <= BigInt(0)) continue;
      const method = String(it.method || "transfer");
      const isSwap = method.toLowerCase().includes("swap");
      trades.push({
        symbol: token.symbol,
        name: token.name,
        tokenAddress: token.tokenAddress,
        side: isSwap ? "buy" : from.hash ? "sell" : "buy",
        from: from.hash || "",
        to: to.hash || "",
        amount,
        decimals,
        timestamp: String(it.timestamp || new Date().toISOString()),
        txHash: String(it.tx_hash || ""),
        method,
      });
    }
    cacheSet(key, trades);
    return trades;
  } catch {
    return [];
  }
}

async function runSweep(): Promise<void> {
  const workerCount = Math.min(32, STOCK_TOKENS.length);
  const results: StockTrade[][] = [];
  let cursor = 0;
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= STOCK_TOKENS.length) return;
      results[idx] = await fetchTransfers(STOCK_TOKENS[idx]);
    }
  });
  await Promise.all(workers);

  const trades = results
    .flat()
    .filter((t) => t.side === "buy" || t.side === "sell")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  sweepCache = { data: { trades, updatedAt: new Date().toISOString() }, ts: Date.now() };
}

function startBackgroundSweep(): void {
  if (sweeping) return;
  sweeping = runSweep()
    .catch((err) => console.error("[stock-trades] background sweep failed:", err))
    .finally(() => {
      sweeping = null;
    });
}

export async function GET(request: NextRequest) {
  const symbol = (request.nextUrl.searchParams.get("symbol") || "").toUpperCase();
  const limit = Math.min(30, Number(request.nextUrl.searchParams.get("limit")) || 20);

  try {
    if (symbol) {
      const tokens = STOCK_TOKENS.filter((t) => t.symbol === symbol);
      if (tokens.length === 0) return NextResponse.json({ trades: [], updatedAt: new Date().toISOString() });
      const trades = await fetchTransfers(tokens[0]);
      return NextResponse.json({
        trades: trades
          .filter((t) => t.side === "buy" || t.side === "sell")
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit)
          .map((t) => ({
            ...t,
            fromShort: short(t.from),
            toShort: short(t.to),
            amountFormatted: (Number(BigInt(t.amount)) / 10 ** t.decimals).toFixed(4),
          })),
        updatedAt: new Date().toISOString(),
      }, { headers: { "Cache-Control": "s-maxage=5, stale-while-revalidate=10" } });
    }

    const now = Date.now();
    if (sweepCache) {
      const stale = now - sweepCache.ts > SWR_MS;
      if (stale) startBackgroundSweep();
      const trades = sweepCache.data.trades.slice(0, limit).map((t) => ({
        ...t,
        fromShort: short(t.from),
        toShort: short(t.to),
        amountFormatted: (Number(BigInt(t.amount)) / 10 ** t.decimals).toFixed(4),
      }));
      return NextResponse.json({
        trades,
        updatedAt: sweepCache.data.updatedAt,
        cached: stale ? "stale" : "fresh",
      }, { headers: { "Cache-Control": "s-maxage=5, stale-while-revalidate=10" } });
    }

    await runSweep();
    const current = sweepCache as { data: SweepResult; ts: number } | null;
    const trades = (current?.data.trades || []).slice(0, limit).map((t) => ({
      ...t,
      fromShort: short(t.from),
      toShort: short(t.to),
      amountFormatted: (Number(BigInt(t.amount)) / 10 ** t.decimals).toFixed(4),
    }));
    return NextResponse.json({
      trades,
      updatedAt: current?.data.updatedAt || new Date().toISOString(),
    }, { headers: { "Cache-Control": "s-maxage=5, stale-while-revalidate=10" } });
  } catch (err) {
    console.error("[stock-trades] Failed:", err);
    return NextResponse.json({ trades: [], updatedAt: new Date().toISOString() });
  }
}
