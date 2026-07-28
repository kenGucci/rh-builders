import { NextResponse } from "next/server";
import { getRobinhoodTokens, mapPair } from "@/lib/token-discovery";

export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "h24";
  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 50);

  try {
    const tokenData = await getRobinhoodTokens();
    const pairs = Array.from(tokenData.bestPerToken.values());

    let sorted = pairs.filter((p) => {
      if (period === "m5") return (p.volume?.m5 || 0) > 0;
      if (period === "h1") return (p.volume?.h1 || 0) > 0;
      if (period === "h6") return (p.volume?.h6 || 0) > 0;
      return (p.volume?.h24 || 0) > 0;
    });

    sorted.sort((a, b) => {
      if (period === "m5") return (b.volume?.m5 || 0) - (a.volume?.m5 || 0);
      if (period === "h1") return (b.volume?.h1 || 0) - (a.volume?.h1 || 0);
      if (period === "h6") return (b.volume?.h6 || 0) - (a.volume?.h6 || 0);
      return (b.volume?.h24 || 0) - (a.volume?.h24 || 0);
    });

    return NextResponse.json({
      coins: sorted.slice(0, limit).map(mapPair),
      period,
      totalTokens: pairs.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[trending] Failed:", err);
    return NextResponse.json({
      coins: [],
      period,
      totalTokens: 0,
      lastUpdated: new Date().toISOString(),
    });
  }
}
