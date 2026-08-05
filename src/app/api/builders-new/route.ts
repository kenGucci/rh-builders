import { NextRequest, NextResponse } from "next/server";
import { getRobinhoodTokens, mapPair } from "@/lib/token-discovery";
import { fetchBuilderOnchainStats, BuilderOnchainStats } from "@/lib/onchain-stats";
import { getSupabaseServer } from "@/lib/supabase-server";
import { v2Fetch } from "@/lib/blockscout";
import builders from "@/lib/builders.json";

export const maxDuration = 60;
export const revalidate = 0;

interface DeployedToken {
  name: string;
  symbol: string;
  address: string;
  imageUrl: string | null;
}

export interface NewBuilder {
  address: string | null;
  name: string | null;
  twitter: string | null;
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
  source: "token" | "x";
  deployedTokens: DeployedToken[];
  stat: BuilderOnchainStats | null;
}

function extractHandle(url: string): string | null {
  const m = url.match(/x\.com\/([^/?#]+)/) || url.match(/twitter\.com\/([^/?#]+)/);
  return m ? m[1].replace(/^@/, "") : null;
}

async function resolveCreator(tokenAddress: string): Promise<string | null> {
  try {
    const j = (await v2Fetch(`/addresses/${tokenAddress.toLowerCase()}`, 300_000)) as Record<string, unknown> | null;
    const creationTx = j?.creation_transaction_hash as string | null;
    if (creationTx) {
      const tx = (await v2Fetch(`/transactions/${creationTx}`, 300_000)) as Record<string, unknown> | null;
      const from = tx?.from as Record<string, unknown> | undefined;
      const deployer = from?.hash as string | null;
      if (deployer && /^0x[a-fA-F0-9]{40}$/.test(deployer) && from?.is_contract === false) {
        return deployer;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "12"), 20);

  const curatedAddrs = new Set(builders.builders.map((b) => b.address.toLowerCase()));

  const tokenBuilders: NewBuilder[] = [];

  try {
    const tokenData = await getRobinhoodTokens();
    const pairs = Array.from(tokenData.bestPerToken.values());
    const oneDayAgo = Date.now() - 86400 * 1000;

    const newPairs = pairs
      .filter((p) => p.pairCreatedAt && p.pairCreatedAt > oneDayAgo)
      .sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0))
      .slice(0, limit);

    const resolved = await Promise.all(
      newPairs.map(async (p) => ({ pair: mapPair(p), creator: await resolveCreator(p.baseToken.address) }))
    );

    const byCreator = new Map<string, NewBuilder>();
    for (const { pair, creator } of resolved) {
      if (!creator) continue;
      const c = creator.toLowerCase();
      if (curatedAddrs.has(c)) continue;
      let nb = byCreator.get(c);
      if (!nb) {
        const twUrl = (pair.socials || []).find((s) => s.type?.toLowerCase() === "twitter")?.url || null;
        nb = {
          address: c,
          name: null,
          twitter: twUrl ? extractHandle(twUrl) : null,
          ens: "",
          description: "",
          category: "New",
          website: "",
          github: "",
          logo: "",
          foundingDate: "",
          team: [],
          tags: ["new", "token-builder"],
          isNew: true,
          source: "token",
          deployedTokens: [],
          stat: null,
        };
        byCreator.set(c, nb);
      }
      nb.deployedTokens.push({ name: pair.name, symbol: pair.symbol, address: pair.address, imageUrl: pair.imageUrl });
    }

    const discovered = Array.from(byCreator.values()).slice(0, limit);
    const withStats = await Promise.all(
      discovered.map(async (nb) => {
        const stats = await fetchBuilderOnchainStats(nb.address!);
        return {
          ...nb,
          name: stats?.name || nb.deployedTokens[0]?.name || null,
          description: `Deployed ${nb.deployedTokens.length} token${nb.deployedTokens.length > 1 ? "s" : ""} on Robinhood Chain`,
          stat: stats,
        } as NewBuilder;
      })
    );
    tokenBuilders.push(...withStats);
  } catch (err) {
    console.error("[builders-new] token discovery failed:", err);
  }

  const xBuilders: NewBuilder[] = [];
  try {
    const supabase = getSupabaseServer();
    if (supabase) {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, x_handle, wallet_address, created_at")
        .eq("provider", "x")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error && Array.isArray(data)) {
        for (const u of data as Array<Record<string, unknown>>) {
          const handle = (u.x_handle as string) || null;
          const wallet = (u.wallet_address as string) || null;
          if (!handle) continue;
          if (wallet && curatedAddrs.has(wallet.toLowerCase())) continue;
          const stat = wallet && /^0x[a-fA-F0-9]{40}$/.test(wallet)
            ? await fetchBuilderOnchainStats(wallet.toLowerCase())
            : null;
          xBuilders.push({
            address: wallet ? wallet.toLowerCase() : null,
            name: (u.name as string) || handle,
            twitter: handle,
            ens: "",
            description: stat ? `Builder on Robinhood Chain` : `Connected via X · wallet not set`,
            category: "X Builder",
            website: "",
            github: "",
            logo: "",
            foundingDate: "",
            team: [],
            tags: ["new", "x-builder"],
            isNew: true,
            source: "x",
            deployedTokens: [],
            stat,
          });
        }
      }
    }
  } catch (err) {
    console.error("[builders-new] X builders failed:", err);
  }

  const all = [...tokenBuilders, ...xBuilders].slice(0, limit + xBuilders.length);

  return NextResponse.json(
    {
      builders: all,
      sources: { tokens: tokenBuilders.length, x: xBuilders.length },
      total: all.length,
      lastUpdated: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } }
  );
}
