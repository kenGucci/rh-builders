import { v2Fetch } from "./blockscout";
import { resolveTokenLogo } from "@/lib/token-logos";

const MAX_TRANSFER_PAGES = 10;
const MAX_TOKEN_CANDIDATES = 40;
const PAGE_SIZE = 50;

export interface DevEarningsToken {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenIcon: string | null;
  tokenPrice: number;
  tokenDecimals: number;
  totalSupply: string;
  marketCap: string | null;
  holdersCount: number;
  launchDate: string | null;
  isCreator: boolean;
  totalClaimed: string;
  totalClaimedUsd: string;
  claimCount: number;
  lastClaimDate: string | null;
  holderBalance: string;
  holderBalanceUsd: string;
  destinationWallet: string | null;
}

export interface DevEarningsResult {
  address: string;
  found: boolean;
  wallet: { ethBalance: string; ethUsd: string; coinPrice: number } | null;
  tokens: DevEarningsToken[];
  totals: {
    tokenCount: number;
    claimedUsd: number;
    claimedTokens: number;
    claimCount: number;
  };
  scannedTokens: number;
  partial: boolean;
  updatedAt: string;
}

interface TokenTransfer {
  from?: { hash?: string } | null;
  to?: { hash?: string } | null;
  token?: {
    address_hash?: string;
    type?: string;
    name?: string;
    symbol?: string;
    icon_url?: string | null;
  } | null;
  total?: { value?: string } | null;
  value?: string;
  timestamp?: string;
}

function parseUint(value: unknown): bigint {
  try {
    const s = String(value ?? "0");
    if (!/^\d+$/.test(s)) return BigInt(0);
    return BigInt(s);
  } catch {
    return BigInt(0);
  }
}

async function fetchAllTokenTransfers(
  creatorLower: string,
  maxPages: number
): Promise<{ items: TokenTransfer[]; partial: boolean }> {
  const all: TokenTransfer[] = [];
  let partial = false;
  let pageParams = `items_count=${PAGE_SIZE}`;

  for (let page = 0; page < maxPages; page++) {
    try {
      const data = await v2Fetch(
        `/addresses/${creatorLower}/token-transfers?${pageParams}`
      ) as { items?: TokenTransfer[]; next_page_params?: Record<string, unknown> | null } | null;

      const items = Array.isArray(data?.items) ? (data.items as TokenTransfer[]) : [];
      all.push(...items);

      const npp = data?.next_page_params;
      if (!npp) break;

      const entries = Object.entries(npp)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
      if (entries.length === 0) break;
      pageParams = entries.join("&");
    } catch (err) {
      console.error("[dev-earnings] transfer page fetch failed:", page, err);
      partial = true;
      break;
    }
  }

  return { items: all, partial };
}

async function fetchTokenInfo(tokenAddr: string): Promise<Record<string, unknown> | null> {
  try {
    const data = await v2Fetch(`/tokens/${tokenAddr}`) as Record<string, unknown> | null;
    return data || null;
  } catch {
    return null;
  }
}

export async function getDevEarnings(creatorAddress: string): Promise<DevEarningsResult> {
  const creatorLower = creatorAddress.toLowerCase();

  const { items: transfers, partial: transfersPartial } = await fetchAllTokenTransfers(creatorLower, MAX_TRANSFER_PAGES);

  const fromLaunchSet = new Set<string>();
  const transferTokenSet = new Set<string>();

  for (const tx of transfers) {
    const token = tx.token;
    if (!token || token.type !== "ERC-20") continue;
    const tAddr = (token.address_hash || "").toLowerCase();
    if (!/^0x[a-fA-F0-9]{40}$/.test(tAddr)) continue;

    transferTokenSet.add(tAddr);
    const fromHash = tx.from?.hash?.toLowerCase();
    if (fromHash === creatorLower) fromLaunchSet.add(tAddr);
  }

  let heldTokens: string[] = [];
  try {
    const held = await v2Fetch(`/addresses/${creatorLower}/tokens?limit=20`) as { items?: Array<{ token?: { address?: string } }> } | null;
    heldTokens = (held?.items || [])
      .map((h) => (h.token?.address || "").toLowerCase())
      .filter((a) => /^0x[a-fA-F0-9]{40}$/.test(a));
  } catch (err) {
    console.error("[dev-earnings] holdings fetch failed:", err);
  }

  const candidates: string[] = [];
  const seen = new Set<string>();
  for (const addr of [...fromLaunchSet, ...heldTokens, ...transferTokenSet]) {
    if (!seen.has(addr)) {
      seen.add(addr);
      candidates.push(addr);
    }
    if (candidates.length >= MAX_TOKEN_CANDIDATES) break;
  }

  async function fetchTokenCreator(tokenAddr: string): Promise<string | null> {
    try {
      const data = await v2Fetch(`/addresses/${tokenAddr}`) as Record<string, unknown> | null;
      const creator = data?.creator_address_hash as string | null;
      return creator ? creator.toLowerCase() : null;
    } catch {
      return null;
    }
  }

  const tokenInfos = await Promise.allSettled(candidates.map(fetchTokenInfo));
  const tokenCreators = await Promise.allSettled(candidates.map(fetchTokenCreator));

  let addressData: Record<string, unknown> | null = null;
  try {
    addressData = await v2Fetch(`/addresses/${creatorLower}`) as Record<string, unknown> | null;
  } catch (err) {
    console.error("[dev-earnings] address fetch failed:", err);
  }

  const coinPrice = Number(addressData?.exchange_rate || 0);
  const rawBalance = String(addressData?.coin_balance || "0");
  const ethBalance = (Number(rawBalance) / 1e18).toFixed(4);
  const wallet = addressData
    ? { ethBalance, ethUsd: (Number(ethBalance) * coinPrice).toFixed(2), coinPrice }
    : null;

  const tokens: DevEarningsToken[] = [];

  candidates.forEach((tAddr, i) => {
    const tokenInfo = tokenInfos[i].status === "fulfilled" ? tokenInfos[i].value : null;
    const tokenCreator = tokenCreators[i].status === "fulfilled" ? tokenCreators[i].value : null;
    const isCreator = tokenCreator === creatorLower;
    const tokenTransfers = transfers.filter((tx) => {
      const tAddrMatch = (tx.token?.address_hash || "").toLowerCase() === tAddr;
      return tAddrMatch && (tx.token?.type || "") === "ERC-20";
    });

    const tokenDecimals = Number(tokenInfo?.decimals || 18);
    const tPrice = parseFloat((tokenInfo?.exchange_rate as string) || "0");
    const divisor = BigInt(10) ** BigInt(tokenDecimals);

    let totalClaimedRaw = BigInt(0);
    let holderBalanceRaw = BigInt(0);
    let claimCount = 0;
    let lastClaimDate: string | null = null;
    let destinationWallet: string | null = null;
    let launchTs: string | null = null;

    for (const tx of tokenTransfers) {
      const fromHash = tx.from?.hash?.toLowerCase();
      const toHash = tx.to?.hash?.toLowerCase();
      const rawValue = parseUint(tx.total?.value ?? tx.value);
      const ts = tx.timestamp || "";

      if (fromHash === creatorLower && (!launchTs || ts > launchTs)) {
        launchTs = ts;
      }
      if (toHash === creatorLower && fromHash !== creatorLower) {
        totalClaimedRaw += rawValue;
        claimCount++;
        if (ts && (!lastClaimDate || ts > lastClaimDate)) lastClaimDate = ts;
        destinationWallet = tx.to?.hash || null;
      }
      if (toHash === creatorLower) {
        holderBalanceRaw += rawValue;
      }
    }

    const totalClaimed = Number(totalClaimedRaw / divisor).toFixed(4);
    const totalClaimedUsd = (Number(totalClaimed) * tPrice).toFixed(2);
    const holderBalance = Number(holderBalanceRaw / divisor).toFixed(4);
    const holderBalanceUsd = (Number(holderBalance) * tPrice).toFixed(2);

    tokens.push({
      tokenAddress: tAddr,
      tokenName: (tokenInfo?.name as string) || "Unknown",
      tokenSymbol: (tokenInfo?.symbol as string) || "???",
      tokenIcon: (tokenInfo?.icon_url as string) || null,
      tokenPrice: tPrice,
      tokenDecimals,
      totalSupply: (tokenInfo?.total_supply as string) || "0",
      marketCap: (tokenInfo?.circulating_market_cap as string) || null,
      holdersCount: Number(tokenInfo?.holders_count || 0),
      launchDate: launchTs,
      isCreator,
      totalClaimed,
      totalClaimedUsd,
      claimCount,
      lastClaimDate,
      holderBalance,
      holderBalanceUsd,
      destinationWallet,
    });
  });

  await Promise.all(
    tokens.map(async (t) => {
      if (t.tokenIcon) return;
      const logo = await resolveTokenLogo(t.tokenAddress);
      if (logo) t.tokenIcon = logo;
    })
  );

  const included = tokens.filter((t) => t.claimCount > 0 || fromLaunchSet.has(t.tokenAddress) || t.totalClaimed !== "0.0000");

  const totals = {
    tokenCount: included.length,
    claimedUsd: included.reduce((sum, t) => sum + Number(t.totalClaimedUsd || 0), 0),
    claimedTokens: included.reduce((sum, t) => sum + Number(t.totalClaimed || 0), 0),
    claimCount: included.reduce((sum, t) => sum + t.claimCount, 0),
  };

  return {
    address: creatorLower,
    found: included.length > 0 || (addressData ? Number(rawBalance) > 0 : false),
    wallet,
    tokens: included,
    totals,
    scannedTokens: candidates.length,
    partial: transfersPartial,
    updatedAt: new Date().toISOString(),
  };
}
