import { NextRequest, NextResponse } from "next/server";
import { v2Fetch } from "@/lib/blockscout";
import { STOCK_TOKENS } from "@/lib/stock-tokens";

const DEFAULT_ETH_USD = 1873;

const STOCK_TOKEN_ADDRESSES = new Set(
  STOCK_TOKENS.map((t) => t.tokenAddress.toLowerCase())
);

interface Holding {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceRaw: string;
  icon: string | null;
  price: number;
  usdValue: number;
  ethValue: number;
}

interface Trade {
  txHash: string;
  side: "buy" | "sell";
  symbol: string;
  name: string;
  tokenAddress: string;
  amount: string;
  amountFormatted: string;
  usdValue: number;
  ethValue: number;
  timestamp: string;
  from: string;
  to: string;
}

function formatBalance(raw: string, decimals: number): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const value = BigInt(raw || "0");
  const whole = value / divisor;
  const frac = value % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 6);
  return `${whole}.${fracStr}`.replace(/\.?0+$/, "") || "0";
}

function toNumber(raw: string, decimals: number): number {
  const divisor = BigInt(10) ** BigInt(decimals);
  const value = BigInt(raw || "0");
  const whole = value / divisor;
  const frac = value % divisor;
  const fracStr = frac.toString().padStart(decimals, "0");
  return Number(`${whole}.${fracStr}`);
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const addr = address.toLowerCase();

  try {
    const [addressData, balancesData, transfersData] = await Promise.allSettled([
      v2Fetch(`/addresses/${addr}`),
      v2Fetch(`/addresses/${addr}/token-balances`),
      v2Fetch(`/addresses/${addr}/token-transfers`),
    ]);

    const addrInfo =
      addressData.status === "fulfilled"
        ? (addressData.value as Record<string, unknown>)
        : null;

    const ethUsd =
      addrInfo && Number(addrInfo.exchange_rate) > 0
        ? Number(addrInfo.exchange_rate)
        : DEFAULT_ETH_USD;

    const coinBalanceRaw =
      addrInfo && typeof addrInfo.coin_balance === "string"
        ? BigInt(addrInfo.coin_balance)
        : BigInt(0);
    const ethBalance = Number(coinBalanceRaw) / 1e18;
    const ethBalanceUsd = ethBalance * ethUsd;

    const holdings: Holding[] = [];
    const balances =
      balancesData.status === "fulfilled" && Array.isArray(balancesData.value)
        ? (balancesData.value as Record<string, unknown>[])
        : [];

    for (const item of balances) {
      const token = (item.token as Record<string, unknown>) || {};
      const tokenAddress = String(token.address_hash || "").toLowerCase();
      if (!STOCK_TOKEN_ADDRESSES.has(tokenAddress)) continue;
      const value = String(item.value || "0");
      if (BigInt(value) <= BigInt(0)) continue;

      const decimals = Number(token.decimals || 18);
      const price = Number(token.exchange_rate || 0);
      const balanceNum = toNumber(value, decimals);
      const usdValue = balanceNum * price;
      holdings.push({
        address: tokenAddress,
        symbol: String(token.symbol || "???"),
        name: String(token.name || token.symbol || "Unknown"),
        decimals,
        balance: formatBalance(value, decimals),
        balanceRaw: value,
        icon: token.icon_url ? String(token.icon_url) : null,
        price,
        usdValue,
        ethValue: ethUsd > 0 ? usdValue / ethUsd : 0,
      });
    }

    holdings.sort((a, b) => b.usdValue - a.usdValue);

    const trades: Trade[] = [];
    const transfers =
      transfersData.status === "fulfilled"
        ? ((transfersData.value as Record<string, unknown>)?.items as Record<string, unknown>[]) || []
        : [];

    for (const it of transfers) {
      const token = (it.token as Record<string, unknown>) || {};
      const tokenAddress = String(token.address_hash || "").toLowerCase();
      if (!STOCK_TOKEN_ADDRESSES.has(tokenAddress)) continue;

      const from = (it.from as Record<string, string>) || {};
      const to = (it.to as Record<string, string>) || {};
      const total = (it.total as Record<string, string>) || {};
      const rawAmount = String(total.value || "0");
      if (BigInt(rawAmount) <= BigInt(0)) continue;

      const decimals = Number(total.decimals || token.decimals || 18);
      const price = Number(token.exchange_rate || 0);
      const amountNum = toNumber(rawAmount, decimals);
      const usdValue = amountNum * price;
      const side: "buy" | "sell" = (to.hash || "").toLowerCase() === addr ? "buy" : "sell";

      trades.push({
        txHash: String(it.transaction_hash || ""),
        side,
        symbol: String(token.symbol || "???"),
        name: String(token.name || token.symbol || "Unknown"),
        tokenAddress,
        amount: rawAmount,
        amountFormatted: formatBalance(rawAmount, decimals),
        usdValue,
        ethValue: ethUsd > 0 ? usdValue / ethUsd : 0,
        timestamp: String(it.timestamp || new Date().toISOString()),
        from: from.hash || "",
        to: to.hash || "",
      });
    }

    trades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const totalStockUsd = holdings.reduce((sum, h) => sum + h.usdValue, 0);
    const totalStockEth = holdings.reduce((sum, h) => sum + h.ethValue, 0);

    return NextResponse.json({
      address: addr,
      eth: {
        balance: ethBalance,
        balanceUsd: ethBalanceUsd,
        usdPrice: ethUsd,
      },
      portfolio: {
        totalStockUsd,
        totalStockEth,
        totalUsd: totalStockUsd + ethBalanceUsd,
        totalEth: totalStockEth + ethBalance,
        holdingsCount: holdings.length,
        tradeCount: trades.length,
      },
      holdings,
      trades,
      updatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "s-maxage=5, stale-while-revalidate=10" } });
  } catch (err) {
    console.error("[profile] Failed:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
