import { NextRequest, NextResponse } from "next/server";
import { searchTokens } from "@/lib/token-discovery";

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 15_000;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Missing search query", tokens: [] }, { status: 400 });
  }

  const query = q.trim();
  const cacheKey = query.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(query);

  try {
    const results = await searchTokens(query);

    const result = {
      query,
      isAddress,
      isSymbol: !isAddress,
      tokens: results,
      total: results.length,
      lastUpdated: new Date().toISOString(),
    };

    cache.set(cacheKey, { data: result, ts: Date.now() });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[token-search] Failed:", err);
    return NextResponse.json({ query, tokens: [], total: 0, lastUpdated: new Date().toISOString() });
  }
}
