import { NextRequest, NextResponse } from "next/server";
import { discoverAllBuilders } from "@/lib/discover-builders";
import { fetchBuilderOnchainStats, type BuilderOnchainStats } from "@/lib/onchain-stats";
import { getSupabaseServer } from "@/lib/supabase-server";
import builders from "@/lib/builders.json";

export const maxDuration = 60;
export const revalidate = 0;

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
  deployedTokens: Array<{
    name: string;
    symbol: string;
    address: string;
    imageUrl: string | null;
  }>;
  stat: BuilderOnchainStats | null;
}

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "60"), 100);

  const curatedAddrs = new Set(builders.builders.map((b) => b.address.toLowerCase()));

  let tokenBuilders: NewBuilder[] = [];
  try {
    const discovered = await discoverAllBuilders({ limit });
    tokenBuilders = discovered.map((b) => ({
      address: b.address,
      name: b.name,
      twitter: b.twitter || null,
      ens: b.ens,
      description: b.description,
      category: b.category,
      website: b.website,
      github: b.github,
      logo: b.logo,
      foundingDate: b.foundingDate,
      team: b.team,
      tags: b.tags,
      isNew: false,
      source: "token" as const,
      deployedTokens: b.deployedTokens,
      stat: b.stat,
    }));
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

  const all = [...tokenBuilders, ...xBuilders].slice(0, limit);

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
