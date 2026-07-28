import { NextRequest, NextResponse } from "next/server";
import { v2Fetch, v1Fetch } from "@/lib/blockscout";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  const tokenAddress = request.nextUrl.searchParams.get("token");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  if (!tokenAddress || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
    return NextResponse.json({ error: "Invalid token address" }, { status: 400 });
  }

  try {
    const [tokenInfoRes, balancesRes] = await Promise.allSettled([
      v2Fetch(`/tokens/${tokenAddress.toLowerCase()}`),
      v2Fetch(`/addresses/${address.toLowerCase()}/token-balances`),
    ]);

    const tokenData = tokenInfoRes.status === "fulfilled" ? tokenInfoRes.value as Record<string, unknown> : null;
    const balancesData = balancesRes.status === "fulfilled" ? balancesRes.value : null;

    if (!tokenData) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    const decimals = Number(tokenData.decimals || 18);
    const holder = Array.isArray(balancesData)
      ? balancesData.find(
          (b: { token: { address: string } }) => b.token?.address?.toLowerCase() === tokenAddress.toLowerCase()
        )
      : null;

    const rawBalance = holder?.value ? BigInt(holder.value) : BigInt(0);
    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = rawBalance / divisor;
    const frac = rawBalance % divisor;
    const fracStr = frac.toString().padStart(decimals, "0").slice(0, 4);
    const balanceFormatted = `${whole}.${fracStr}`;
    const balanceRaw = rawBalance.toString();

    const exchangeRate = parseFloat(String(tokenData.exchange_rate || "0"));
    const tokenPrice = exchangeRate;
    const tokenValue = Number(balanceFormatted) * tokenPrice;

    let tokenTransfers = 0;
    try {
      const txData = await v1Fetch("account", "tokentx", {
        address: address.toLowerCase(),
        contractaddress: tokenAddress.toLowerCase(),
        page: "1",
        offset: "1000",
        sort: "desc",
      }) as Record<string, unknown>;
      if (Array.isArray(txData?.result)) {
        tokenTransfers = txData.result.length;
      }
    } catch (err) {
      console.error("[token-balance] Transfer count fetch failed:", err);
    }

    return NextResponse.json({
      tokenAddress: tokenAddress.toLowerCase(),
      tokenName: tokenData.name || "Unknown",
      tokenSymbol: tokenData.symbol || "???",
      tokenDecimals: decimals,
      tokenIcon: tokenData.icon_url || null,
      tokenPrice,
      tokenMarketCap: tokenData.circulating_market_cap || null,
      tokenVolume24h: tokenData.volume_24h || null,
      holdersCount: tokenData.holders_count || 0,
      holderBalance: balanceFormatted,
      holderBalanceRaw: balanceRaw,
      holderBalanceUsd: tokenValue > 0 ? tokenValue.toFixed(2) : "0",
      holderPercentage: holder?.fiat_value
        ? (Number(holder.fiat_value) / Number(tokenData.circulating_market_cap || 1) * 100).toFixed(4)
        : null,
      tokenTransfers,
      isVerified: tokenData.is_verified || false,
    });
  } catch (err) {
    console.error("[token-balance] Failed:", err);
    return NextResponse.json({ error: "Failed to fetch token balance" }, { status: 500 });
  }
}
