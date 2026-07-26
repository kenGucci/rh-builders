import { NextRequest, NextResponse } from "next/server";

const V2 = "https://robinhoodchain.blockscout.com/api/v2";

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
      fetch(`${V2}/tokens/${tokenAddress.toLowerCase()}`, { signal: AbortSignal.timeout(10000) }),
      fetch(`${V2}/addresses/${address.toLowerCase()}/token-balances`, { signal: AbortSignal.timeout(10000) }),
    ]);

    const tokenData = tokenInfoRes.status === "fulfilled" && tokenInfoRes.value.ok
      ? await tokenInfoRes.value.json()
      : null;

    const balancesData = balancesRes.status === "fulfilled" && balancesRes.value.ok
      ? await balancesRes.value.json()
      : null;

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
    const divisor = BigInt("1" + "0".repeat(decimals));
    const whole = rawBalance / divisor;
    const frac = rawBalance % divisor;
    const fracStr = frac.toString().padStart(decimals, "0").slice(0, 4);
    const balanceFormatted = `${whole}.${fracStr}`;
    const balanceRaw = rawBalance.toString();

    const exchangeRate = parseFloat(tokenData.exchange_rate || "0");
    const tokenPrice = exchangeRate;
    const tokenValue = Number(balanceFormatted) * tokenPrice;

    let tokenTransfers = 0;
    try {
      const txRes = await fetch(
        `https://robinhoodchain.blockscout.com/api?module=account&action=tokentx&address=${address.toLowerCase()}&contractaddress=${tokenAddress.toLowerCase()}&page=1&offset=1000&sort=desc`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (txRes.ok) {
        const txData = await txRes.json();
        if (Array.isArray(txData?.result)) {
          tokenTransfers = txData.result.length;
        }
      }
    } catch {}

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
  } catch {
    return NextResponse.json({ error: "Failed to fetch token balance" }, { status: 500 });
  }
}
