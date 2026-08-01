import { NextRequest, NextResponse } from "next/server";
import builders from "@/lib/builders.json";
import { findStockToken } from "@/lib/stock-tokens";

const BLOCKSCOUT_API_V2 = "https://robinhoodchain.blockscout.com/api/v2";

// ─── In-memory cache ───
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function cachedGet(key: string) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;
  return undefined;
}

function cachedSet(key: string, data: unknown) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

async function apiFetch(url: string, timeoutMs = 5000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`Blockscout API error: ${res.status}`);
  return res.json();
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function searchRegistry(query: string): { address: string; label: string } | null {
  const q = normalize(query.replace(/^@/, ""));
  for (const b of builders.builders) {
    if (!b.address || !/^0x[a-fA-F0-9]{40}$/.test(b.address)) continue;
    const fields = [b.name, b.twitter, b.ens, b.address, ...(b.tags || [])].filter(Boolean) as string[];
    if (
      fields.some(
        (f) =>
          normalize(f) === q ||
          normalize(f).includes(q) ||
          q.includes(normalize(f))
      )
    ) {
      return { address: b.address, label: b.name || b.twitter || b.ens || "" };
    }
  }
  return null;
}

interface BlockscoutSearchItem {
  type: string;
  address_hash?: string;
  name?: string;
  symbol?: string;
  token_type?: string;
  is_smart_contract_address?: boolean;
}

async function searchBlockscout(query: string): Promise<{
  type: string;
  address: string;
  label: string | null;
  token_symbol?: string | null;
  token_name?: string | null;
  token_info?: {
    name: string;
    symbol: string;
    decimals: string;
    total_supply: string;
    holders_count: number;
    market_cap: string | null;
    exchange_rate: string | null;
  } | null;
  creator?: string | null;
} | null> {
  const data = await apiFetch(
    `${BLOCKSCOUT_API_V2}/search?q=${encodeURIComponent(query)}`,
    6000
  );

  const items: BlockscoutSearchItem[] = data.items || [];
  if (items.length === 0) return null;

  const best = items[0];
  const addr = best.address_hash;
  if (!addr) return null;

  if (best.type === "token" || best.token_type) {
    // Enrich token + resolve creator in parallel (both bounded by the same 5s timeout)
    const [tokenInfo, addrData] = await Promise.all([
      apiFetch(`${BLOCKSCOUT_API_V2}/tokens/${addr.toLowerCase()}`).catch(() => null),
      apiFetch(`${BLOCKSCOUT_API_V2}/addresses/${addr.toLowerCase()}`).catch(() => null),
    ]);

    return {
      type: "token",
      address: addr.toLowerCase(),
      label: best.name || best.symbol || query,
      token_symbol: best.symbol ?? null,
      token_name: best.name ?? null,
      token_info: tokenInfo
        ? {
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.decimals,
            total_supply: tokenInfo.total_supply,
            holders_count: tokenInfo.holders_count,
            market_cap: tokenInfo.circulating_market_cap,
            exchange_rate: tokenInfo.exchange_rate,
          }
        : null,
      creator: addrData?.creator_address_hash ?? null,
    };
  }

  return {
    type: best.type === "address" ? "address" : "contract",
    address: addr.toLowerCase(),
    label: best.name || null,
  };
}

async function resolveTokenCA(address: string) {
  try {
    const [tokenInfo, addrData] = await Promise.all([
      apiFetch(`${BLOCKSCOUT_API_V2}/tokens/${address.toLowerCase()}`),
      apiFetch(`${BLOCKSCOUT_API_V2}/addresses/${address.toLowerCase()}`).catch(() => null),
    ]);

    return {
      type: "token",
      address: address.toLowerCase(),
      label: tokenInfo.name || tokenInfo.symbol || null,
      token_symbol: tokenInfo.symbol || null,
      token_name: tokenInfo.name || null,
      token_info: {
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        total_supply: tokenInfo.total_supply,
        holders_count: tokenInfo.holders_count,
        market_cap: tokenInfo.circulating_market_cap,
        exchange_rate: tokenInfo.exchange_rate,
      },
      creator: addrData?.creator_address_hash || null,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const trimmed = q.trim();
  const cacheKey = trimmed.toLowerCase();
  const cached = cachedGet(cacheKey);
  if (cached) return NextResponse.json(cached);

  // Direct wallet or contract address (0x...{40}) — fast path, single bounded call
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    // Known Stock Token address — resolve instantly without hitting Blockscout
    const stockToken = findStockToken(trimmed);
    if (stockToken) {
      const result = {
        type: "token",
        address: stockToken.tokenAddress.toLowerCase(),
        label: stockToken.name,
        token_symbol: stockToken.symbol,
        token_name: stockToken.name,
      };
      cachedSet(cacheKey, result);
      return NextResponse.json(result);
    }
    try {
      const data = await apiFetch(
        `${BLOCKSCOUT_API_V2}/addresses/${trimmed.toLowerCase()}`,
        4000
      );
      let result: Record<string, unknown>;
      if (data.is_contract) {
        const tokenResult = await resolveTokenCA(trimmed);
        if (tokenResult) {
          result = tokenResult;
        } else {
          result = {
            type: "contract",
            address: data.hash.toLowerCase(),
            label: data.name || data.token?.name || null,
            token_symbol: data.token?.symbol || null,
            token_name: data.token?.name || null,
          };
        }
      } else {
        result = {
          type: "address",
          address: data.hash.toLowerCase(),
          label: data.name || null,
        };
      }
      cachedSet(cacheKey, result);
      return NextResponse.json(result);
    } catch {
      const fallback = {
        type: "address",
        address: trimmed.toLowerCase(),
        label: null,
      };
      cachedSet(cacheKey, fallback);
      return NextResponse.json(fallback);
    }
  }

  // Check local builder registry (instant)
  const registryMatch = searchRegistry(trimmed);
  if (registryMatch) {
    const result = {
      type: "address",
      address: registryMatch.address.toLowerCase(),
      label: registryMatch.label,
    };
    cachedSet(cacheKey, result);
    return NextResponse.json(result);
  }

  // Check local Stock Token registry (instant) — matches symbol or contract address
  const stockToken = findStockToken(trimmed);
  if (stockToken) {
    const result = {
      type: "token",
      address: stockToken.tokenAddress.toLowerCase(),
      label: stockToken.name,
      token_symbol: stockToken.symbol,
      token_name: stockToken.name,
    };
    cachedSet(cacheKey, result);
    return NextResponse.json(result);
  }

  // Search Blockscout for anything matching the query (tokens, addresses, Twitter handles)
  try {
    const result = await searchBlockscout(trimmed);
    if (result) {
      cachedSet(cacheKey, result);
      return NextResponse.json(result);
    }
  } catch {}

  const result = {
    type: "unknown",
    address: null,
    label: null,
    message: `No results found for "${trimmed}". Try a wallet address, token name, or contract address (CA).`,
  };
  cachedSet(cacheKey, result);
  return NextResponse.json(result);
}
