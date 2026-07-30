import { NextRequest, NextResponse } from "next/server";
import { v2Fetch } from "@/lib/blockscout";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const data = await v2Fetch(`/addresses/${address.toLowerCase()}/token-balances`) as Record<string, unknown>[];
    if (!Array.isArray(data)) {
      return NextResponse.json({ tokens: [] });
    }

    const tokens = data
      .filter((item: Record<string, unknown>) => {
        const token = item.token as Record<string, unknown> | undefined;
        const value = item.value as string | undefined;
        return token && token.symbol && value && value !== "0";
      })
      .map((item: Record<string, unknown>) => {
        const token = item.token as Record<string, unknown>;
        const value = item.value as string;
        const decimals = Number(token.decimals || 18);
        const divisor = BigInt(10) ** BigInt(decimals);
        const raw = BigInt(value);
        const whole = raw / divisor;
        const frac = raw % divisor;
        const fracStr = frac.toString().padStart(decimals, "0").slice(0, 6);
        const balance = `${whole}.${fracStr}`.replace(/\.?0+$/, "");
        return {
          address: token.address || "",
          name: token.name || token.symbol,
          symbol: token.symbol,
          decimals,
          balance,
          icon: token.icon_url || null,
        };
      })
      .slice(0, 50);

    return NextResponse.json({ tokens, count: tokens.length });
  } catch {
    return NextResponse.json({ tokens: [], count: 0 });
  }
}
