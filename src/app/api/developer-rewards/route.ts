import { NextRequest, NextResponse } from "next/server";
import { v2Fetch, v1Fetch } from "@/lib/blockscout";

interface DevReward {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenIcon: string | null;
  tokenPrice: number;
  holderBalance: string;
  holderBalanceUsd: string;
  totalClaimed: string;
  totalClaimedUsd: string;
  claimCount: number;
  lastClaimDate: string | null;
  isClaimed: boolean;
  destinationWallet: string | null;
}

interface TokenLaunch {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenIcon: string | null;
  launchDate: string;
  holdersCount: number;
}

interface DevRewardResponse {
  creatorAddress: string | null;
  token: {
    address: string;
    name: string;
    symbol: string;
    icon: string | null;
    price: number;
    holdersCount: number;
    totalSupply: string;
    marketCap: string | null;
  } | null;
  creatorBalance: {
    eth: string;
    ethUsd: string;
  } | null;
  reward: DevReward | null;
  previousLaunches: TokenLaunch[];
  transactionHistory: {
    hash: string;
    type: string;
    value: string;
    timestamp: string;
    method: string;
  }[];
}

function isAddressValid(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function GET(request: NextRequest) {
  const tokenAddress = request.nextUrl.searchParams.get("tokenAddress");

  if (!tokenAddress || !isAddressValid(tokenAddress)) {
    return NextResponse.json({ error: "Invalid token address" }, { status: 400 });
  }

  const tokenAddrLower = tokenAddress.toLowerCase();

  try {
    const [tokenData, addrData] = await Promise.allSettled([
      v2Fetch(`/tokens/${tokenAddrLower}`) as Promise<Record<string, unknown>>,
      v2Fetch(`/addresses/${tokenAddrLower}`) as Promise<Record<string, unknown>>,
    ]);

    if (tokenData.status === "rejected" || !tokenData.value) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    const tData = tokenData.value;
    const creatorAddress = addrData.status === "fulfilled"
      ? (addrData.value?.creator_address_hash as string || null)
      : null;

    const tokenPrice = parseFloat((tData.exchange_rate as string) || "0");
    const holdersCount = Number(tData.holders_count || 0);
    const totalSupply = (tData.total_supply as string) || "0";
    const marketCap = (tData.circulating_market_cap as string) || null;

    let creatorBalance = null;
    if (creatorAddress) {
      const balData = await v2Fetch(`/addresses/${creatorAddress.toLowerCase()}`).catch(() => null) as Record<string, unknown> | null;
      if (balData?.coin_balance) {
        const eth = (Number(balData.coin_balance) / 1e18).toFixed(4);
        const ethPrice = Number(balData.coin_price ?? 0);
        const ethUsd = (Number(eth) * ethPrice).toFixed(2);
        creatorBalance = { eth, ethUsd };
      }
    }

    let allTransfers: Record<string, unknown>[] = [];
    if (creatorAddress) {
      try {
        const transfersData = await v2Fetch(`/addresses/${creatorAddress.toLowerCase()}/token-transfers`) as { items?: Record<string, unknown>[] };
        allTransfers = transfersData.items || [];
      } catch (err) {
        console.error("[developer-rewards] Failed to fetch transfers:", err);
      }
    }

    let reward: DevReward | null = null;
    if (creatorAddress) {
      try {
        const walletLower = creatorAddress.toLowerCase();

        let totalClaimedRaw = BigInt(0);
        let claimCount = 0;
        let lastClaimDate: string | null = null;
        let destinationWallet: string | null = null;
        let holderBalanceRaw = BigInt(0);

        for (const t of allTransfers) {
          const toAddr = (t.to as Record<string, unknown>)?.hash as string;
          const fromAddr = (t.from as Record<string, unknown>)?.hash as string;
          const tToken = t.token as Record<string, unknown> | undefined;
          const tTokenAddr = (tToken?.address_hash as string || "").toLowerCase();

          if (tTokenAddr !== tokenAddrLower) continue;

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

        const decimals = Number(tData.decimals || 18);
        const divisor = BigInt(10) ** BigInt(decimals);
        const totalClaimed = Number(totalClaimedRaw / divisor).toFixed(4);
        const totalClaimedUsd = (Number(totalClaimed) * tokenPrice).toFixed(2);
        const holderBalance = Number(holderBalanceRaw / divisor).toFixed(4);
        const holderBalanceUsd = (Number(holderBalance) * tokenPrice).toFixed(2);

        reward = {
          tokenAddress: tokenAddrLower,
          tokenName: (tData.name as string) || "Unknown",
          tokenSymbol: (tData.symbol as string) || "???",
          tokenIcon: (tData.icon_url as string) || null,
          tokenPrice,
          holderBalance,
          holderBalanceUsd,
          totalClaimed,
          totalClaimedUsd,
          claimCount,
          lastClaimDate,
          isClaimed: totalClaimedRaw > BigInt(0),
          destinationWallet,
        };
      } catch (err) {
        console.error("[developer-rewards] Reward calculation failed:", err);
      }
    }

    let previousLaunches: TokenLaunch[] = [];
    if (creatorAddress) {
      try {
        const launches = allTransfers;
        const seen = new Set<string>();

        for (const l of launches) {
          const fromAddr = (l.from as Record<string, unknown>)?.hash as string;
          const tToken = l.token as Record<string, unknown> | undefined;
          const tAddr = (tToken?.address_hash as string || "").toLowerCase();

          if (!tAddr || seen.has(tAddr)) continue;
          if (fromAddr?.toLowerCase() !== creatorAddress.toLowerCase()) continue;
          if (tAddr === tokenAddrLower) continue;

          seen.add(tAddr);

          let tokenInfo: Record<string, unknown> | null = null;
          try {
            tokenInfo = await v2Fetch(`/tokens/${tAddr}`) as Record<string, unknown>;
          } catch (err) {
            console.error("[developer-rewards] Token info fetch failed:", tAddr, err);
          }

          previousLaunches.push({
            tokenAddress: tAddr,
            tokenName: (tokenInfo?.name as string) || (tToken?.name as string) || "Unknown",
            tokenSymbol: (tokenInfo?.symbol as string) || (tToken?.symbol as string) || "???",
            tokenIcon: (tokenInfo?.icon_url as string) || (tToken?.icon_url as string) || null,
            launchDate: (l.timestamp as string) || "",
            holdersCount: Number(tokenInfo?.holders_count || 0),
          });

          if (previousLaunches.length >= 10) break;
        }
      } catch (err) {
        console.error("[developer-rewards] Previous launches fetch failed:", err);
      }
    }

    let transactionHistory: DevRewardResponse["transactionHistory"] = [];
    try {
      const txData = await v1Fetch("account", "txlist", {
        address: creatorAddress || tokenAddrLower,
        startblock: "0",
        endblock: "99999999",
        page: "1",
        offset: "20",
        sort: "desc",
      }) as { result?: Record<string, unknown>[] };

      if (Array.isArray(txData.result)) {
        transactionHistory = txData.result.map((tx) => ({
          hash: (tx.hash as string) || "",
          type: String(tx.from || "").toLowerCase() === (creatorAddress || "").toLowerCase() ? "outgoing" : "incoming",
          value: (Number(tx.value || 0) / 1e18).toFixed(4),
          timestamp: tx.timeStamp ? new Date(Number(tx.timeStamp) * 1000).toISOString() : "",
          method: (tx.functionName as string) || "",
        }));
      }
    } catch (err) {
      console.error("[developer-rewards] Transaction history fetch failed:", err);
    }

    const response: DevRewardResponse = {
      creatorAddress,
      token: {
        address: tokenAddrLower,
        name: (tData.name as string) || "Unknown",
        symbol: (tData.symbol as string) || "???",
        icon: (tData.icon_url as string) || null,
        price: tokenPrice,
        holdersCount,
        totalSupply,
        marketCap,
      },
      creatorBalance,
      reward,
      previousLaunches,
      transactionHistory,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Failed to fetch developer rewards" }, { status: 500 });
  }
}
