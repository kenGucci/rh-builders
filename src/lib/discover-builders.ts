import { v2Fetch } from "@/lib/blockscout";
import { fetchBuilderOnchainStats, type BuilderOnchainStats } from "@/lib/onchain-stats";
import builders from "@/lib/builders.json";

export interface DiscoveredToken {
  name: string;
  symbol: string;
  address: string;
  imageUrl: string | null;
  holders: number;
}

export interface DiscoveredBuilder {
  address: string;
  name: string;
  twitter: string;
  ens: string;
  description: string;
  category: string;
  website: string;
  github: string;
  logo: string;
  foundingDate: string;
  team: string[];
  tags: string[];
  isNew: boolean;
  source: "token";
  deployedTokens: DiscoveredToken[];
  stat: BuilderOnchainStats | null;
}

const TOKEN_SAMPLE = 250;
const STATS_CAP = 20;
const STORE_MAX = 100;

interface TokenItem {
  address_hash: string;
  name: string;
  symbol: string;
  icon_url: string | null;
  holders_count: string;
  type?: string;
}

let cache: { builders: DiscoveredBuilder[]; ts: number } | null = null;
const CACHE_TTL = 60_000;

async function fetchTopTokens(limit: number): Promise<TokenItem[]> {
  try {
    const data = (await v2Fetch(
      `/tokens?type=ERC-20&sort=holders_count&order=desc&limit=${limit}`,
      120_000
    )) as { items?: TokenItem[] } | null;
    return (data?.items || []).filter(
      (t) => t.address_hash && t.type === "ERC-20"
    );
  } catch {
    return [];
  }
}

async function resolveCreator(tokenAddress: string): Promise<string | null> {
  try {
    const d = (await v2Fetch(`/addresses/${tokenAddress.toLowerCase()}`)) as Record<string, unknown> | null;
    const creator = d?.creator_address_hash as string | null;
    if (creator && /^0x[a-fA-F0-9]{40}$/.test(creator)) {
      return creator.toLowerCase();
    }
    return null;
  } catch {
    return null;
  }
}

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export async function discoverAllBuilders(opts?: {
  limit?: number;
}): Promise<DiscoveredBuilder[]> {
  const limit = Math.max(1, Math.min(opts?.limit ?? 60, 100));

  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.builders.slice(0, limit);
  }
  const tokens = await fetchTopTokens(TOKEN_SAMPLE);

  const creators = new Array<string | null>(tokens.length).fill(null);
  let cursor = 0;
  const workers = Array.from({ length: 16 }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= tokens.length) return;
      creators[idx] = await resolveCreator(tokens[idx].address_hash);
    }
  });
  await Promise.all(workers);

  const byCreator = new Map<string, DiscoveredToken[]>();
  for (let i = 0; i < tokens.length; i++) {
    const c = creators[i];
    if (!c) continue;
    const t = tokens[i];
    let list = byCreator.get(c);
    if (!list) {
      list = [];
      byCreator.set(c, list);
    }
    list.push({
      name: t.name || "Unknown",
      symbol: t.symbol || "???",
      address: t.address_hash,
      imageUrl: t.icon_url || null,
      holders: Number(t.holders_count) || 0,
    });
  }

  const curated = new Map(
    builders.builders
      .filter((b) => b.address)
      .map((b) => [b.address.toLowerCase(), b])
  );

  const ranked = Array.from(byCreator.entries())
    .map(([address, deployedTokens]) => {
      const totalHolders = deployedTokens.reduce((s, t) => s + t.holders, 0);
      return {
        address,
        deployedTokens,
        totalHolders,
        tokenCount: deployedTokens.length,
      };
    })
    .sort(
      (a, b) =>
        b.tokenCount - a.tokenCount || b.totalHolders - a.totalHolders
    );

  const statTargets = ranked.slice(0, STATS_CAP);
  const statResults = await Promise.all(
    statTargets.map(async (e) => {
      const curatedMeta = curated.get(e.address);
      if (curatedMeta) return null;
      try {
        return { address: e.address, stat: await fetchBuilderOnchainStats(e.address) };
      } catch {
        return null;
      }
    })
  );
  const statMap = new Map(
    statResults.filter((r): r is NonNullable<typeof r> => r !== null).map((r) => [r.address, r.stat])
  );

  const result: DiscoveredBuilder[] = ranked.slice(0, STORE_MAX).map((e) => {
    const curatedMeta = curated.get(e.address);
    const primary = e.deployedTokens[0];
    return {
      address: e.address,
      name: curatedMeta?.name || primary?.name || shortAddr(e.address),
      twitter: curatedMeta?.twitter || "",
      ens: curatedMeta?.ens || "",
      description:
        curatedMeta?.description ||
        `Deployed ${e.tokenCount} token${e.tokenCount > 1 ? "s" : ""} on Robinhood Chain`,
      category: curatedMeta?.category || "Token Builder",
      website: curatedMeta?.website || "",
      github: curatedMeta?.github || "",
      logo: curatedMeta?.logo || "",
      foundingDate: curatedMeta?.foundingDate || "",
      team: curatedMeta?.team || [],
      tags: curatedMeta?.tags?.length
        ? curatedMeta.tags
        : ["on-chain", "token-builder"],
      isNew: false,
      source: "token",
      deployedTokens: e.deployedTokens,
      stat: statMap.get(e.address) ?? null,
    };
  });

  cache = { builders: result, ts: Date.now() };
  return cache.builders.slice(0, limit);
}

export async function discoverBuilderCount(): Promise<number> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.builders.length;
  }
  await discoverAllBuilders({ limit: STORE_MAX });
  return cache?.builders.length ?? 0;
}
