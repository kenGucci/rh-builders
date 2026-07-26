import { NextRequest, NextResponse } from "next/server";
import builders from "@/lib/builders.json";

const BLOCKSCOUT_API_V2 = "https://robinhoodchain.blockscout.com/api/v2";

async function apiFetch(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
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
    `${BLOCKSCOUT_API_V2}/search?q=${encodeURIComponent(query)}`
  );

  const items: BlockscoutSearchItem[] = data.items || [];

  if (items.length === 0) return null;

  const best = items[0];
  const addr = best.address_hash;
  if (!addr) return null;

  if (best.type === "token" || best.token_type) {
    let tokenInfo: {
      name: string; symbol: string; decimals: string; total_supply: string;
      holders_count: number; circulating_market_cap: string | null; exchange_rate: string | null;
    } | null = null;
    try {
      tokenInfo = await apiFetch(`${BLOCKSCOUT_API_V2}/tokens/${addr.toLowerCase()}`);
    } catch {}

    let creator: string | null = null;
    try {
      const addrData = await apiFetch(`${BLOCKSCOUT_API_V2}/addresses/${addr.toLowerCase()}`);
      creator = addrData.creator_address_hash ?? null;
    } catch {}

    return {
      type: "token",
      address: addr.toLowerCase(),
      label: best.name || best.symbol || query,
      token_symbol: best.symbol ?? null,
      token_name: best.name ?? null,
      token_info: tokenInfo ? {
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        total_supply: tokenInfo.total_supply,
        holders_count: tokenInfo.holders_count,
        market_cap: tokenInfo.circulating_market_cap,
        exchange_rate: tokenInfo.exchange_rate,
      } : null,
      creator,
    };
  }

  if (best.type === "address" || best.is_smart_contract_address) {
    return {
      type: "address",
      address: addr.toLowerCase(),
      label: best.name || null,
    };
  }

  return {
    type: "address",
    address: addr.toLowerCase(),
    label: best.name || null,
  };
}

async function resolveTokenCA(address: string) {
  try {
    const tokenInfo = await apiFetch(`${BLOCKSCOUT_API_V2}/tokens/${address.toLowerCase()}`);

    let creator = null;
    try {
      const addrData = await apiFetch(`${BLOCKSCOUT_API_V2}/addresses/${address.toLowerCase()}`);
      creator = addrData.creator_address_hash || null;
    } catch {}

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
      creator,
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

  // Direct wallet or contract address (0x...{40})
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    try {
      const data = await apiFetch(
        `${BLOCKSCOUT_API_V2}/addresses/${trimmed.toLowerCase()}`
      );
      if (data.is_contract) {
        const tokenResult = await resolveTokenCA(trimmed);
        if (tokenResult) {
          return NextResponse.json(tokenResult);
        }
        return NextResponse.json({
          type: "contract",
          address: data.hash.toLowerCase(),
          label: data.name || data.token?.name || null,
          token_symbol: data.token?.symbol || null,
          token_name: data.token?.name || null,
        });
      }
      return NextResponse.json({
        type: "address",
        address: data.hash.toLowerCase(),
        label: data.name || null,
      });
    } catch {
      return NextResponse.json({
        type: "address",
        address: trimmed.toLowerCase(),
        label: null,
      });
    }
  }

  // Check local builder registry
  const registryMatch = searchRegistry(trimmed);
  if (registryMatch) {
    return NextResponse.json({
      type: "address",
      address: registryMatch.address.toLowerCase(),
      label: registryMatch.label,
    });
  }

  // Search Blockscout for anything matching the query (tokens, addresses, Twitter handles)
  try {
    const result = await searchBlockscout(trimmed);
    if (result) {
      return NextResponse.json(result);
    }
  } catch {}

  return NextResponse.json({
    type: "unknown",
    address: null,
    label: null,
    message: `No results found for "${trimmed}". Try a wallet address, token name, or contract address (CA).`,
  });
}
