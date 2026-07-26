import { NextRequest, NextResponse } from "next/server";

const V2 = "https://robinhoodchain.blockscout.com/api/v2";

async function apiFetch(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const addrLower = address.toLowerCase();

  const [addressRes, tokensRes, txsRes, historyRes] = await Promise.allSettled([
    apiFetch(`${V2}/addresses/${addrLower}`),
    apiFetch(`${V2}/addresses/${addrLower}/tokens?limit=20`),
    apiFetch(`${V2}/addresses/${addrLower}/transactions?limit=10`),
    apiFetch(`${V2}/addresses/${addrLower}/coin-balance-history?limit=30`),
  ]);

  const addressData = addressRes.status === "fulfilled" ? addressRes.value : null;
  const tokensData = tokensRes.status === "fulfilled" ? tokensRes.value : null;
  const txsData = txsRes.status === "fulfilled" ? txsRes.value : null;
  const historyData = historyRes.status === "fulfilled" ? historyRes.value : null;

  if (!addressData) {
    return NextResponse.json({ error: "Failed to fetch address info" }, { status: 502 });
  }

  const tokenBalances = Array.isArray(tokensData?.items)
    ? tokensData.items.map((t: Record<string, unknown>) => {
        const token = t.token as Record<string, unknown> | undefined;
        const value = t.value as string | undefined;
        const tokenDecimals = Number(token?.decimals ?? 18);
        const raw = BigInt(value ?? "0");
        const divisor = BigInt("1" + "0".repeat(tokenDecimals));
        const balance = (Number(raw) / Number(divisor)).toString();
        const price = Number(token?.exchange_rate ?? 0);
        const balanceUsd = (Number(balance) * price).toFixed(2);

        return {
          address: (token?.address as string) ?? "",
          name: (token?.name as string) ?? "Unknown",
          symbol: (token?.symbol as string) ?? "???",
          balance,
          balanceUsd,
          price: price.toString(),
          icon: (token?.icon_url as string) ?? null,
          holdersCount: (token?.holders_count as number) ?? 0,
        };
      })
    : [];

  const recentTransactions = Array.isArray(txsData?.items)
    ? txsData.items.map((tx: Record<string, unknown>) => ({
        hash: (tx.hash as string) ?? "",
        from: (tx.from as Record<string, unknown>)?.hash as string ?? "",
        to: (tx.to as Record<string, unknown>)?.hash as string ?? "",
        value: (tx.value as string) ?? "0",
        timestamp: (tx.timestamp as string) ?? "",
        method: (tx.method as string) ?? null,
        status: (tx.status as string) ?? "unknown",
        blockNumber: (tx.block as number) ?? 0,
      }))
    : [];

  const balanceHistory = Array.isArray(historyData?.items)
    ? historyData.items.map((h: Record<string, unknown>) => ({
        timestamp: (h.timestamp as string) ?? "",
        balance: (h.value as string) ?? "0",
      }))
    : [];

  return NextResponse.json({
    address: addressData.hash ?? address,
    isContract: addressData.is_contract ?? false,
    name: addressData.name ?? null,
    ethBalance: addressData.coin_balance ?? "0",
    ethBalanceUsd: addressData.coin_balance ? (Number(addressData.coin_balance) * Number(addressData.coin_price ?? 0)).toFixed(2) : "0",
    txCount: addressData.tx_count ?? 0,
    tokenBalances,
    recentTransactions,
    balanceHistory,
    coinPrice: (addressData.coin_price as string) ?? "0",
    exchangeRate: (addressData.exchange_rate as string) ?? "0",
  });
}
