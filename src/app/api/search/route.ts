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

async function apiFetch(url: string, timeoutMs = 15000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`Blockscout API error: ${res.status}`);
  return res.json();
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function searchRegistry(query: string): {
  address: string | null;
  label: string;
  matchType: "x" | "wallet";
  twitter: string | null;
} | null {
  const q = normalize(query.replace(/^@/, ""));
  for (const b of builders.builders) {
    const twitterNorm = b.twitter ? normalize(b.twitter) : "";
    const isXHandleMatch = twitterNorm !== "" && (twitterNorm === q || q.includes(twitterNorm) || twitterNorm.includes(q));
    if (!isXHandleMatch && (!b.address || !/^0x[a-fA-F0-9]{40}$/.test(b.address))) continue;
    const fields = [b.name, b.twitter, b.ens, b.address, ...(b.tags || [])].filter(Boolean) as string[];
    const matched =
      isXHandleMatch ||
      fields.some(
        (f) =>
          normalize(f) === q ||
          normalize(f).includes(q) ||
          q.includes(normalize(f))
      );
    if (!matched) continue;
    const validAddr = b.address && /^0x[a-fA-F0-9]{40}$/.test(b.address);
    return {
      address: validAddr ? b.address : null,
      label: b.name || b.twitter || b.ens || "",
      matchType: isXHandleMatch ? "x" : "wallet",
      twitter: b.twitter || null,
    };
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
  matchType: string;
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
    icon_url?: string | null;
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
    // Enrich token + resolve creator in parallel
    const [tokenInfo, addrData] = await Promise.all([
      apiFetch(`${BLOCKSCOUT_API_V2}/tokens/${addr.toLowerCase()}`).catch(() => null),
      apiFetch(`${BLOCKSCOUT_API_V2}/addresses/${addr.toLowerCase()}`).catch(() => null),
    ]);

    return {
      type: "token",
      matchType: addrData?.creator_address_hash ? "project" : "token",
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
            market_cap: tokenInfo.circulating_market_cap ?? null,
            exchange_rate: tokenInfo.exchange_rate ?? null,
            icon_url: tokenInfo.icon_url ?? null,
          }
        : null,
      creator: addrData?.creator_address_hash ?? null,
    };
  }

  return {
    type: best.type === "address" ? "address" : "contract",
    matchType: best.type === "address" ? "wallet" : "contract",
    address: addr.toLowerCase(),
    label: best.name || null,
  };
}

async function resolveTokenCA(address: string) {
  try {
    const [tokenInfo, addrData] = await Promise.all([
      apiFetch(`${BLOCKSCOUT_API_V2}/tokens/${address.toLowerCase()}`, 8000),
      apiFetch(`${BLOCKSCOUT_API_V2}/addresses/${address.toLowerCase()}`, 6000).catch(() => null),
    ]);

    return {
      type: "token",
      matchType: addrData?.creator_address_hash ? "project" : "token",
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
        market_cap: tokenInfo.circulating_market_cap ?? null,
        exchange_rate: tokenInfo.exchange_rate ?? null,
        icon_url: tokenInfo.icon_url ?? null,
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
        matchType: "token",
        address: stockToken.tokenAddress.toLowerCase(),
        label: stockToken.name,
        token_symbol: stockToken.symbol,
        token_name: stockToken.name,
      };
      cachedSet(cacheKey, result);
      return NextResponse.json(result);
    }
    try {
      // Fast classification via the /search endpoint (answers in ~1s) instead of
      // the /addresses/{hash} endpoint which can take 3-10s and time out.
      const searchData = await apiFetch(`${BLOCKSCOUT_API_V2}/search?q=${trimmed}`, 8000);
      const items: BlockscoutSearchItem[] = searchData.items || [];
      const best =
        items.find((i) => i.address_hash?.toLowerCase() === trimmed.toLowerCase()) ||
        items[0];

      if (best?.address_hash) {
        const addr = best.address_hash.toLowerCase();
        if (best.type === "token" || best.token_type) {
          const tokenResult = await resolveTokenCA(addr);
          if (tokenResult) {
            cachedSet(cacheKey, tokenResult);
            return NextResponse.json(tokenResult);
          }
        }
        if (best.is_smart_contract_address) {
          const tokenResult = await resolveTokenCA(addr);
          if (tokenResult) {
            cachedSet(cacheKey, tokenResult);
            return NextResponse.json(tokenResult);
          }
          const result = {
            type: "contract" as const,
            matchType: "contract" as const,
            address: addr,
            label: best.name || null,
            token_symbol: best.symbol ?? null,
            token_name: best.name ?? null,
          };
          cachedSet(cacheKey, result);
          return NextResponse.json(result);
        }
        const result = {
          type: "address" as const,
          matchType: "wallet" as const,
          address: addr,
          label: best.name || null,
        };
        cachedSet(cacheKey, result);
        return NextResponse.json(result);
      }

      const data = await apiFetch(
        `${BLOCKSCOUT_API_V2}/addresses/${trimmed.toLowerCase()}`,
        15000
      );
      let result: Record<string, unknown>;
      if (data.is_contract) {
        const tokenResult = await resolveTokenCA(trimmed);
        if (tokenResult) {
          result = tokenResult;
        } else {
          result = {
            type: "contract",
            matchType: "contract",
            address: data.hash.toLowerCase(),
            label: data.name || data.token?.name || null,
            token_symbol: data.token?.symbol || null,
            token_name: data.token?.name || null,
          };
        }
      } else {
        result = {
          type: "address",
          matchType: "wallet",
          address: data.hash.toLowerCase(),
          label: data.name || null,
        };
      }
      cachedSet(cacheKey, result);
      return NextResponse.json(result);
    } catch {
      const fallback = {
        type: "address",
        matchType: "wallet",
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
      type: registryMatch.address ? "address" : "x",
      matchType: registryMatch.matchType,
      twitter: registryMatch.twitter,
      address: registryMatch.address ? registryMatch.address.toLowerCase() : null,
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
      matchType: "token",
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

  // X handle (not in local registry) — e.g. @handle, or a bare handle containing "_"
  const bare = trimmed.replace(/^@/, "");
  const looksLikeHandle = /^@[a-zA-Z0-9_]{1,15}$/.test(trimmed) || (bare.includes("_") && /^[a-zA-Z0-9_]{2,15}$/.test(bare));
  if (looksLikeHandle) {
    const xResult = {
      type: "x",
      matchType: "x",
      address: null,
      twitter: bare,
      label: bare,
    };
    cachedSet(cacheKey, xResult);
    return NextResponse.json(xResult);
  }

  const result = {
    type: "unknown",
    address: null,
    label: null,
    message: `No results found for "${trimmed}". Try a wallet address, token name, or contract address (CA).`,
  };
  cachedSet(cacheKey, result);
  return NextResponse.json(result);
}
