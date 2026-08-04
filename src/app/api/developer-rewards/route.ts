import { NextRequest, NextResponse } from "next/server";
import { v2Fetch, v1Fetch, v2RecentlyFailed } from "@/lib/blockscout";

interface DevReward {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenIcon: string | null;
  tokenPrice: number;
  tokenDecimals: number;
  totalSupply: string;
  marketCap: string | null;
  holdersCount: number;
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
  tokenPrice: number;
  totalSupply: string;
  marketCap: string | null;
  holdersCount: number;
  launchDate: string;
  reward: {
    totalClaimed: string;
    totalClaimedUsd: string;
    claimCount: number;
    lastClaimDate: string | null;
    holderBalance: string;
    holderBalanceUsd: string;
  } | null;
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
    decimals: number;
  } | null;
  creatorBalance: {
    eth: string;
    ethUsd: string;
  } | null;
  reward: DevReward | null;
  allDeployedTokens: TokenLaunch[];
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
      const tokenPath = `/tokens/${tokenAddrLower}`;
      if (v2RecentlyFailed(tokenPath)) {
        return NextResponse.json({ error: "Token data temporarily unavailable (upstream rate limited)" }, { status: 503 });
      }
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
    const decimals = Number(tData.decimals || 18);

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

    function calcRewardForToken(
  tAddr: string,
  tInfo: Record<string, unknown>,
  transfers: Record<string, unknown>[],
  creatorWallet: string
): DevReward | null {
  try {
    const walletLower = creatorWallet.toLowerCase();
    let totalClaimedRaw = BigInt(0);
    let claimCount = 0;
    let lastClaimDate: string | null = null;
    let destinationWallet: string | null = null;
    let holderBalanceRaw = BigInt(0);
    const tDecimals = Number(tInfo.decimals || 18);
    const tPrice = parseFloat((tInfo.exchange_rate as string) || "0");

    for (const tx of transfers) {
      const toAddr = (tx.to as Record<string, unknown>)?.hash as string;
      const fromAddr = (tx.from as Record<string, unknown>)?.hash as string;
      const tToken = tx.token as Record<string, unknown> | undefined;
      const tTokenAddr = (tToken?.address_hash as string || "").toLowerCase();
      if (tTokenAddr !== tAddr) continue;

      const rawValue = (tx.total as Record<string, unknown>)?.value || tx.value || "0";
      const tFrom = fromAddr?.toLowerCase();
      const tTo = toAddr?.toLowerCase();

      if (tTo === walletLower && tFrom !== walletLower) {
        totalClaimedRaw += BigInt(String(rawValue || "0"));
        claimCount++;
        const ts = tx.timestamp as string;
        if (ts && (!lastClaimDate || ts > lastClaimDate)) {
          lastClaimDate = ts;
        }
        destinationWallet = toAddr;
      }

      if (tTo === walletLower) {
        holderBalanceRaw += BigInt(String(rawValue || "0"));
      }
    }

    const divisor = BigInt(10) ** BigInt(tDecimals);
    const totalClaimed = Number(totalClaimedRaw / divisor).toFixed(4);
    const totalClaimedUsd = (Number(totalClaimed) * tPrice).toFixed(2);
    const holderBalance = Number(holderBalanceRaw / divisor).toFixed(4);
    const holderBalanceUsd = (Number(holderBalance) * tPrice).toFixed(2);

    return {
      tokenAddress: tAddr,
      tokenName: (tInfo.name as string) || "Unknown",
      tokenSymbol: (tInfo.symbol as string) || "???",
      tokenIcon: (tInfo.icon_url as string) || null,
      tokenPrice: tPrice,
      tokenDecimals: tDecimals,
      totalSupply: (tInfo.total_supply as string) || "0",
      marketCap: (tInfo.circulating_market_cap as string) || null,
      holdersCount: Number(tInfo.holders_count || 0),
      holderBalance,
      holderBalanceUsd,
      totalClaimed,
      totalClaimedUsd,
      claimCount,
      lastClaimDate,
      isClaimed: totalClaimedRaw > BigInt(0),
      destinationWallet,
    };
  } catch {
    return null;
  }
}

    let reward: DevReward | null = null;
    if (creatorAddress) {
      reward = calcRewardForToken(tokenAddrLower, tData, allTransfers, creatorAddress);
    }

    const allDeployedTokens: TokenLaunch[] = [];
    const previousLaunches: TokenLaunch[] = [];
    if (creatorAddress) {
      try {
        const launches = allTransfers;
        const seen = new Set<string>();
        const candidates: { tAddr: string; transfer: Record<string, unknown> }[] = [];

        for (const l of launches) {
          const fromAddr = (l.from as Record<string, unknown>)?.hash as string;
          const tToken = l.token as Record<string, unknown> | undefined;
          const tAddr = (tToken?.address_hash as string || "").toLowerCase();

          if (!tAddr || seen.has(tAddr)) continue;
          if (fromAddr?.toLowerCase() !== creatorAddress.toLowerCase()) continue;

          seen.add(tAddr);
          candidates.push({ tAddr, transfer: l });
          if (candidates.length >= 50) break;
        }

        const tokenInfos = await Promise.allSettled(
          candidates.map(({ tAddr }) => v2Fetch(`/tokens/${tAddr}`) as Promise<Record<string, unknown>>)
        );

        candidates.forEach(({ tAddr, transfer }, i) => {
          const tokenInfo = tokenInfos[i].status === "fulfilled"
            ? tokenInfos[i].value
            : null;

          // Calculate reward for this specific token
          const tokenReward = tAddr === tokenAddrLower
            ? reward
            : calcRewardForToken(tAddr, tokenInfo || (transfer.token as Record<string, unknown>) || {}, allTransfers, creatorAddress);

          const launchEntry: TokenLaunch = {
            tokenAddress: tAddr,
            tokenName: (tokenInfo?.name as string) || ((transfer.token as Record<string, unknown> | undefined)?.name as string) || "Unknown",
            tokenSymbol: (tokenInfo?.symbol as string) || ((transfer.token as Record<string, unknown> | undefined)?.symbol as string) || "???",
            tokenIcon: (tokenInfo?.icon_url as string) || ((transfer.token as Record<string, unknown> | undefined)?.icon_url as string) || null,
            tokenPrice: parseFloat((tokenInfo?.exchange_rate as string) || "0"),
            totalSupply: (tokenInfo?.total_supply as string) || "0",
            marketCap: (tokenInfo?.circulating_market_cap as string) || null,
            holdersCount: Number(tokenInfo?.holders_count || 0),
            launchDate: (transfer.timestamp as string) || "",
            reward: tokenReward ? {
              totalClaimed: tokenReward.totalClaimed,
              totalClaimedUsd: tokenReward.totalClaimedUsd,
              claimCount: tokenReward.claimCount,
              lastClaimDate: tokenReward.lastClaimDate,
              holderBalance: tokenReward.holderBalance,
              holderBalanceUsd: tokenReward.holderBalanceUsd,
            } : null,
          };

          allDeployedTokens.push(launchEntry);

          if (tAddr !== tokenAddrLower) {
            previousLaunches.push(launchEntry);
          }
        });
      } catch (err) {
        console.error("[developer-rewards] Deployed tokens fetch failed:", err);
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
        decimals,
      },
      creatorBalance,
      reward,
      allDeployedTokens,
      previousLaunches,
      transactionHistory,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Failed to fetch developer rewards" }, { status: 500 });
  }
}
