import { NextRequest, NextResponse } from "next/server";
import { v2Fetch } from "@/lib/blockscout";

const V2 = "https://robinhoodchain.blockscout.com/api/v2";
const DEXSCREENER_API = "https://api.dexscreener.com";

async function apiFetch(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchDexData(tokenAddress: string) {
  try {
    const res = await fetch(
      `${DEXSCREENER_API}/latest/dex/tokens/${tokenAddress.toLowerCase()}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pair = (data.pairs || []).find(
      (p: Record<string, unknown>) => p.chainId === "robinhood"
    );
    if (!pair) return null;
    return {
      priceUsd: pair.priceUsd || "0",
      priceNative: pair.priceNative || "0",
      marketCap: pair.marketCap || pair.fdv || 0,
      fdv: pair.fdv || 0,
      liquidityUsd: (pair.liquidity as Record<string, unknown>)?.usd || 0,
      volume24h: (pair.volume as Record<string, unknown>)?.h24 || 0,
      volume1h: (pair.volume as Record<string, unknown>)?.h1 || 0,
      priceChange24h: (pair.priceChange as Record<string, unknown>)?.h24 || 0,
      priceChange1h: (pair.priceChange as Record<string, unknown>)?.h1 || 0,
      buys24h: ((pair.txns as Record<string, unknown>)?.h24 as Record<string, unknown>)?.buys || 0,
      sells24h: ((pair.txns as Record<string, unknown>)?.h24 as Record<string, unknown>)?.sells || 0,
      dex: pair.dexId || "unknown",
      pairAddress: pair.pairAddress || "",
      url: pair.url || "",
    };
  } catch {
    return null;
  }
}

async function fetchCreatorRewards(address: string, tokenAddress: string) {
  try {
    const addrData = await apiFetch(`${V2}/addresses/${tokenAddress.toLowerCase()}`) as Record<string, unknown>;
    const creatorAddress = addrData.creator_address_hash as string | null;
    if (!creatorAddress || creatorAddress.toLowerCase() !== address.toLowerCase()) return null;

    const tData = await apiFetch(`${V2}/tokens/${tokenAddress.toLowerCase()}`) as Record<string, unknown>;
    const tokenPrice = parseFloat((tData.exchange_rate as string) || "0");
    const decimals = Number(tData.decimals || 18);

    const transfersData = await v2Fetch(`/addresses/${address.toLowerCase()}/token-transfers`) as { items?: Record<string, unknown>[] };
    const transfers = transfersData.items || [];
    const walletLower = address.toLowerCase();

    let totalClaimedRaw = BigInt(0);
    let claimCount = 0;
    let lastClaimDate: string | null = null;
    let destinationWallet: string | null = null;
    let holderBalanceRaw = BigInt(0);

    for (const t of transfers) {
      const toAddr = (t.to as Record<string, unknown>)?.hash as string;
      const fromAddr = (t.from as Record<string, unknown>)?.hash as string;
      const tToken = t.token as Record<string, unknown> | undefined;
      const tTokenAddr = (tToken?.address_hash as string || "").toLowerCase();

      if (tTokenAddr !== tokenAddress.toLowerCase()) continue;

      const rawValue = (t.total as Record<string, unknown>)?.value || t.value || "0";
      const tFrom = fromAddr?.toLowerCase();
      const tTo = toAddr?.toLowerCase();

      if (tTo === walletLower && tFrom !== walletLower) {
        totalClaimedRaw += BigInt(String(rawValue || "0"));
        claimCount++;
        const ts = t.timestamp as string;
        if (ts && (!lastClaimDate || ts > lastClaimDate)) {
          lastClaimDate = ts;
        }
        destinationWallet = toAddr;
      }

      if (tTo === walletLower) {
        holderBalanceRaw += BigInt(String(rawValue || "0"));
      }
    }

    const divisor = BigInt(10 ** decimals);
    const totalClaimed = Number(totalClaimedRaw / divisor).toFixed(4);
    const totalClaimedUsd = (Number(totalClaimed) * tokenPrice).toFixed(2);
    const holderBalance = Number(holderBalanceRaw / divisor).toFixed(4);
    const holderBalanceUsd = (Number(holderBalance) * tokenPrice).toFixed(2);

    return {
      isCreator: true,
      totalClaimed,
      totalClaimedUsd,
      claimCount,
      lastClaimDate,
      holderBalance,
      holderBalanceUsd,
      destinationWallet,
      tokenName: (tData.name as string) || "Unknown",
      tokenSymbol: (tData.symbol as string) || "???",
      tokenIcon: (tData.icon_url as string) || null,
      tokenPrice,
    };
  } catch {
    return null;
  }
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

  interface RawToken {
    address: string; name: string; symbol: string; balance: string; balanceUsd: string;
    price: string; icon: string | null; holdersCount: number; decimals: number;
  }

  const rawTokenBalances: RawToken[] = Array.isArray(tokensData?.items)
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
          decimals: tokenDecimals,
        };
      })
    : [];

  // Fetch DexScreener data for each token in parallel (batch)
  const dexResults = await Promise.allSettled(
    rawTokenBalances.slice(0, 10).map((t) => fetchDexData(t.address))
  );

  // Check if builder is creator of any tokens
  const creatorResults = await Promise.allSettled(
    rawTokenBalances.slice(0, 10).map((t) => fetchCreatorRewards(addrLower, t.address))
  );

  const tokenBalances = rawTokenBalances.map((t, i) => {
    const dex = dexResults[i].status === "fulfilled" ? dexResults[i].value : null;
    const creator = creatorResults[i].status === "fulfilled" ? creatorResults[i].value : null;
    return {
      ...t,
      dex: dex ? {
        priceUsd: dex.priceUsd,
        priceNative: dex.priceNative,
        marketCap: dex.marketCap,
        liquidityUsd: dex.liquidityUsd,
        volume24h: dex.volume24h,
        volume1h: dex.volume1h,
        priceChange24h: dex.priceChange24h,
        priceChange1h: dex.priceChange1h,
        buys24h: dex.buys24h,
        sells24h: dex.sells24h,
        dex: dex.dex,
        pairAddress: dex.pairAddress,
        url: dex.url,
      } : null,
      creatorReward: creator && creator.isCreator ? {
        totalClaimed: creator.totalClaimed,
        totalClaimedUsd: creator.totalClaimedUsd,
        claimCount: creator.claimCount,
        lastClaimDate: creator.lastClaimDate,
        holderBalance: creator.holderBalance,
        holderBalanceUsd: creator.holderBalanceUsd,
        destinationWallet: creator.destinationWallet,
      } : null,
    };
  });

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
