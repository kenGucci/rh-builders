const BLOCKSCOUT_V2 = "https://robinhoodchain.blockscout.com/api/v2";
const ETH_BLOCKSCOUT = "https://eth.blockscout.com/api/v2";

export interface KOLProfile {
  address: string;
  name: string;
  handle: string | null;
  avatar: string | null;
  description: string;
  tags: string[];
  followers: number | null;
  influence: number | null;
  socialScore: number | null;
  verified: boolean;
  networks: string[];
  totalTokensTraded: number;
  totalVolumeUsd: string;
  dailyPnl: string;
  dailyPnlPercent: number;
  winRate: number | null;
  recentActivity: KOLActivity[];
  topTokens: TopToken[];
  socialActivity: SocialActivity[];
  balanceEth: string;
  balanceUsd: string;
  rank?: number;
  pnlUsd: string;
  pnlPercent: number;
  totalTxs: number;
  tokenCount: number;
  portfolioValue: string;
}

export interface KOLActivity {
  hash: string;
  type: string;
  method: string;
  value: string;
  timestamp: string;
  tokenAddress: string | null;
  tokenSymbol: string | null;
  tokenName: string | null;
  tokenIcon: string | null;
  from: string;
  to: string;
  direction: "in" | "out" | "self";
  chain: string;
}

export interface TopToken {
  address: string;
  name: string;
  symbol: string;
  icon: string | null;
  interactionCount: number;
  totalVolumeUsd: string;
  lastInteraction: string;
  chain: string;
}

export interface SocialActivity {
  platform: string;
  text: string;
  url: string;
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
}

export interface XProfileData {
  displayName: string;
  avatar: string | null;
  description: string;
  followers: number | null;
  bannerUrl: string | null;
}

const xProfileCache = new Map<string, { data: XProfileData; ts: number }>();
const X_CACHE_TTL = 300_000;

export async function fetchXProfile(handle: string): Promise<XProfileData | null> {
  const lower = handle.toLowerCase();
  const cached = xProfileCache.get(lower);
  if (cached && Date.now() - cached.ts < X_CACHE_TTL) return cached.data;

  try {
    const res = await fetch(
      `https://publish.twitter.com/oembed?url=https://x.com/${handle}&omit_script=true&dnt=true`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const html = data.html || "";

    let displayName = handle;
    if (data.author_name) {
      displayName = data.author_name;
    } else {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      if (titleMatch) {
        const nameMatch = titleMatch[1].match(/^(.+?)\s*\(@/);
        if (nameMatch) displayName = nameMatch[1].trim();
      }
    }

    let avatar: string | null = null;
    const avatarMatch = html.match(/src="(https:\/\/pbs\.twimg\.com\/profile_images\/[^"]+)"/);
    if (avatarMatch) {
      avatar = avatarMatch[1].replace(/_normal(\.\w+)$/, "_400x400$1");
    }

    let description = "";
    const descMatch =
      html.match(/content="([^"]+)"[^>]*property="og:description"/) ||
      html.match(/property="og:description"[^>]*content="([^"]+)"/);
    if (descMatch) description = descMatch[1].substring(0, 200);

    let followers: number | null = null;
    const followersMatch = html.match(/"followers_count":(\d+)/);
    if (followersMatch) followers = parseInt(followersMatch[1]);

    let bannerUrl: string | null = null;
    const bannerMatch = html.match(/https:\/\/pbs\.twimg\.com\/profile_banners\/\d+\/\d+\/1500x500/);
    if (bannerMatch) bannerUrl = bannerMatch[0];

    const data_: XProfileData = { displayName, avatar, description, followers, bannerUrl };
    xProfileCache.set(lower, { data: data_, ts: Date.now() });
    return data_;
  } catch {
    return null;
  }
}

const blockscoutCache = new Map<string, { data: unknown; ts: number }>();

async function cachedFetch(url: string, ttl = 60_000): Promise<unknown> {
  const cached = blockscoutCache.get(url);
  if (cached && Date.now() - cached.ts < ttl) return cached.data;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    blockscoutCache.set(url, { data, ts: Date.now() });
    return data;
  } catch {
    return null;
  }
}

export async function fetchRecentTransactions(): Promise<KOLActivity[]> {
  const data = await cachedFetch(`${BLOCKSCOUT_V2}/main-page/transactions`, 30_000) as { items?: unknown[] } | null;
  if (!data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = Array.isArray(data) ? data : (data.items || []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return items.map((tx: any) => {
    const rawValue = typeof tx.value === "string" ? tx.value : "0";
    const ethValue = (Number(rawValue) / 1e18).toFixed(4);
    const from = (tx.from?.hash as string) || "";
    const to = (tx.to?.hash as string) || "";

    return {
      hash: tx.hash as string,
      type: tx.type as string || "coin_transfer",
      method: (tx.method as string) || "Transfer",
      value: ethValue,
      timestamp: (tx.timestamp as string) || "",
      tokenAddress: null,
      tokenSymbol: null,
      tokenName: null,
      tokenIcon: null,
      from,
      to,
      direction: "self" as const,
      chain: "robinhood",
    };
  });
}

export async function fetchTopTokens(): Promise<TopToken[]> {
  const data = await cachedFetch(`${BLOCKSCOUT_V2}/tokens?sort=holders_count&order=desc&limit=20`, 60_000) as { items?: unknown[] } | null;
  if (!data) return [];

  const items = (data.items || []) as Array<{
    address_hash?: string;
    name?: string;
    symbol?: string;
    icon_url?: string;
    holders_count?: number;
    volume_24h?: string;
    exchange_rate?: string;
  }>;

  return items
    .filter((t) => t.address_hash && t.symbol)
    .slice(0, 20)
    .map((t) => ({
      address: t.address_hash || "",
      name: t.name || t.symbol || "",
      symbol: t.symbol || "",
      icon: t.icon_url || null,
      interactionCount: t.holders_count || 0,
      totalVolumeUsd: t.volume_24h || "0",
      lastInteraction: "",
      chain: "robinhood",
    }));
}

export async function fetchChainStats(): Promise<{
  totalAddresses: number;
  totalTransactions: number;
  totalBlocks: number;
  txsToday: number;
  coinPrice: string;
  marketCap: string;
  avgBlockTime: number;
  gasPrices: { slow: number; average: number; fast: number };
}> {
  const data = await cachedFetch(`${BLOCKSCOUT_V2}/stats`) as Record<string, unknown> | null;
  if (!data) return {
    totalAddresses: 0, totalTransactions: 0, totalBlocks: 0,
    txsToday: 0, coinPrice: "0", marketCap: "0", avgBlockTime: 0,
    gasPrices: { slow: 0, average: 0, fast: 0 },
  };

  const gasPrices = data.gas_prices as Record<string, number> || {};
  return {
    totalAddresses: Number(data.total_addresses || 0),
    totalTransactions: Number(data.total_transactions || 0),
    totalBlocks: Number(data.total_blocks || 0),
    txsToday: Number(data.transactions_today || 0),
    coinPrice: String(data.coin_price || "0"),
    marketCap: String(data.market_cap || "0"),
    avgBlockTime: Number(data.average_block_time || 0),
    gasPrices: {
      slow: Number(gasPrices.slow || 0),
      average: Number(gasPrices.average || 0),
      fast: Number(gasPrices.fast || 0),
    },
  };
}

export async function fetchAddressBalance(address: string, chain: "robinhood" | "ethereum" = "robinhood"): Promise<{
  balanceEth: string;
  balanceUsd: string;
  txCount: number;
  tokenCount: number;
  coinPrice: number;
}> {
  const base = chain === "ethereum" ? ETH_BLOCKSCOUT : BLOCKSCOUT_V2;
  try {
    const data = await cachedFetch(`${base}/addresses/${address}`, 60_000) as Record<string, unknown> | null;
    if (!data) return { balanceEth: "0", balanceUsd: "0", txCount: 0, tokenCount: 0, coinPrice: 0 };

    const rawBalance = String(data.coin_balance || "0");
    const balanceEth = (Number(rawBalance) / 1e18).toFixed(4);

    const coinPrice = chain === "ethereum"
      ? Number(((await cachedFetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd", 300_000) as Record<string, unknown>)?.ethereum as Record<string, unknown>)?.usd || 2000)
      : Number(((await cachedFetch(`${BLOCKSCOUT_V2}/stats`, 60_000) as Record<string, unknown>)?.coin_price || 0));

    const balanceUsd = (Number(balanceEth) * coinPrice).toFixed(2);

    const txCount = Number(data.transaction_count || 0);
    const tokenCount = Number(data.token_balances_count || data.tokens_count || 0);

    return { balanceEth, balanceUsd, txCount, tokenCount, coinPrice };
  } catch {
    return { balanceEth: "0", balanceUsd: "0", txCount: 0, tokenCount: 0, coinPrice: 0 };
  }
}

export async function fetchTokenHoldings(address: string, chain: "robinhood" | "ethereum" = "robinhood"): Promise<Array<{
  name: string;
  symbol: string;
  balance: string;
  valueUsd: string;
  icon: string | null;
}>> {
  const base = chain === "ethereum" ? ETH_BLOCKSCOUT : BLOCKSCOUT_V2;
  try {
    const data = await cachedFetch(`${base}/addresses/${address}/token-transfers?page=1&filter=to%20%7C%20from`, 60_000) as { items?: unknown[] } | null;
    if (!data) return [];

    const tokenMap = new Map<string, { name: string; symbol: string; balance: string; valueUsd: string; icon: string | null }>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const tx of (data.items || []) as any[]) {
      const token = tx.token as { name?: string; symbol?: string; icon_url?: string } | undefined;
      const total = tx.total as { value?: string; decimals?: string } | undefined;
      if (!token?.symbol) continue;
      const key = `${token.symbol}-${tx.token?.address || ""}`;
      if (!tokenMap.has(key)) {
        tokenMap.set(key, {
          name: token.name || token.symbol,
          symbol: token.symbol,
          balance: total?.value || "0",
          valueUsd: "0",
          icon: token.icon_url || null,
        });
      }
    }

    return Array.from(tokenMap.values()).slice(0, 10);
  } catch {
    return [];
  }
}

async function apiFetch(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchBlockscoutActivity(address: string): Promise<{ activity: KOLActivity[]; tokens: TopToken[] }> {
  try {
    const txData = await apiFetch(
      `${BLOCKSCOUT_V2}/addresses/${address}/transactions?page=1&filter=to%20%7C%20from`
    ) as { items?: unknown[] };

    const tokenMap = new Map<string, { count: number; lastSeen: string; name: string; symbol: string; icon: string | null; address: string }>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activity: KOLActivity[] = (txData.items || []).slice(0, 20).map((tx: any) => {
      const rawValue = typeof tx.value === "string" ? tx.value : "0";
      const ethValue = (Number(rawValue) / 1e18).toFixed(4);

      const transfers = tx.token_transfers as
        | { token?: { address?: string; symbol?: string; name?: string; icon_url?: string } }[]
        | undefined;
      const tokenInfo = transfers?.[0];
      const tokenAddress = tokenInfo?.token?.address || null;
      const tokenSymbol = tokenInfo?.token?.symbol || null;
      const tokenName = tokenInfo?.token?.name || null;
      const tokenIcon = tokenInfo?.token?.icon_url || null;

      if (tokenAddress && tokenSymbol) {
        const existing = tokenMap.get(tokenAddress);
        if (existing) {
          existing.count++;
          existing.lastSeen = (tx.timestamp as string) || "";
        } else {
          tokenMap.set(tokenAddress, {
            count: 1,
            lastSeen: (tx.timestamp as string) || "",
            name: tokenName || tokenSymbol,
            symbol: tokenSymbol,
            icon: tokenIcon,
            address: tokenAddress,
          });
        }
      }

      const from = (tx.from?.hash as string) || "";
      const to = (tx.to?.hash as string) || "";
      const direction =
        from.toLowerCase() === address.toLowerCase()
          ? "out"
          : to.toLowerCase() === address.toLowerCase()
          ? "in"
          : "self";

      return {
        hash: tx.hash as string,
        type: tx.type as string,
        method: (tx.method as string) || "Transfer",
        value: ethValue,
        timestamp: (tx.timestamp as string) || "",
        tokenAddress,
        tokenSymbol,
        tokenName,
        tokenIcon,
        from,
        to,
        direction,
        chain: "robinhood",
      };
    });

    const tokens: TopToken[] = Array.from(tokenMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((t) => ({
        address: t.address,
        name: t.name,
        symbol: t.symbol,
        icon: t.icon,
        interactionCount: t.count,
        totalVolumeUsd: "~",
        lastInteraction: t.lastSeen,
        chain: "robinhood",
      }));

    return { activity, tokens };
  } catch {
    return { activity: [], tokens: [] };
  }
}

export async function fetchEthBlockscoutActivity(address: string): Promise<{ activity: KOLActivity[]; tokens: TopToken[] }> {
  try {
    const txData = await apiFetch(
      `${ETH_BLOCKSCOUT}/addresses/${address}/transactions?page=1&filter=to%20%7C%20from`
    ) as { items?: unknown[] };

    const tokenMap = new Map<string, { count: number; lastSeen: string; name: string; symbol: string; icon: string | null; address: string }>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activity: KOLActivity[] = (txData.items || []).slice(0, 20).map((tx: any) => {
      const rawValue = typeof tx.value === "string" ? tx.value : "0";
      const ethValue = (Number(rawValue) / 1e18).toFixed(4);

      const transfers = tx.token_transfers as
        | { token?: { address?: string; symbol?: string; name?: string; icon_url?: string } }[]
        | undefined;
      const tokenInfo = transfers?.[0];
      const tokenAddress = tokenInfo?.token?.address || null;
      const tokenSymbol = tokenInfo?.token?.symbol || null;
      const tokenName = tokenInfo?.token?.name || null;
      const tokenIcon = tokenInfo?.token?.icon_url || null;

      if (tokenAddress && tokenSymbol) {
        const existing = tokenMap.get(tokenAddress);
        if (existing) {
          existing.count++;
          existing.lastSeen = (tx.timestamp as string) || "";
        } else {
          tokenMap.set(tokenAddress, {
            count: 1,
            lastSeen: (tx.timestamp as string) || "",
            name: tokenName || tokenSymbol,
            symbol: tokenSymbol,
            icon: tokenIcon,
            address: tokenAddress,
          });
        }
      }

      const from = (tx.from?.hash as string) || "";
      const to = (tx.to?.hash as string) || "";
      const direction =
        from.toLowerCase() === address.toLowerCase()
          ? "out"
          : to.toLowerCase() === address.toLowerCase()
          ? "in"
          : "self";

      return {
        hash: tx.hash as string,
        type: tx.type as string,
        method: (tx.method as string) || "Transfer",
        value: ethValue,
        timestamp: (tx.timestamp as string) || "",
        tokenAddress,
        tokenSymbol,
        tokenName,
        tokenIcon,
        from,
        to,
        direction,
        chain: "ethereum",
      };
    });

    const tokens: TopToken[] = Array.from(tokenMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((t) => ({
        address: t.address,
        name: t.name,
        symbol: t.symbol,
        icon: t.icon,
        interactionCount: t.count,
        totalVolumeUsd: "~",
        lastInteraction: t.lastSeen,
        chain: "ethereum",
      }));

    return { activity, tokens };
  } catch {
    return { activity: [], tokens: [] };
  }
}

export async function buildKOLProfileFromRegistry(
  kol: { address: string; name: string; handle: string | null; description: string; tags: string[] },
  ethAddresses?: string[]
): Promise<KOLProfile> {
  const [robinhoodData, ethData, xProfile] = await Promise.allSettled([
    kol.address ? fetchBlockscoutActivity(kol.address) : Promise.resolve({ activity: [], tokens: [] }),
    ethAddresses?.[0] ? fetchEthBlockscoutActivity(ethAddresses[0]) : Promise.resolve({ activity: [], tokens: [] }),
    kol.handle ? fetchXProfile(kol.handle) : Promise.resolve(null),
  ]);

  const rhResult = robinhoodData.status === "fulfilled" ? robinhoodData.value : { activity: [], tokens: [] };
  const ethResult = ethData.status === "fulfilled" ? ethData.value : { activity: [], tokens: [] };
  const xResult = xProfile.status === "fulfilled" ? xProfile.value : null;

  const allActivity = [...rhResult.activity, ...ethResult.activity].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const allTokens = [...rhResult.tokens, ...ethResult.tokens]
    .sort((a, b) => b.interactionCount - a.interactionCount)
    .slice(0, 10);

  const totalVolume = allActivity.reduce((sum, a) => sum + parseFloat(a.value || "0"), 0);
  const networks: string[] = [];
  if (rhResult.activity.length > 0) networks.push("Robinhood Chain");
  if (ethResult.activity.length > 0) networks.push("Ethereum");

  const totalTxs = allActivity.length;
  const tokenCount = allTokens.length;
  const followers = xResult?.followers ?? 0;

  return {
    address: kol.address,
    name: xResult?.displayName || kol.name,
    handle: kol.handle,
    avatar: xResult?.avatar || null,
    description: xResult?.description || kol.description,
    tags: kol.tags,
    followers: xResult?.followers ?? null,
    influence: null,
    socialScore: null,
    verified: false,
    networks,
    totalTokensTraded: tokenCount,
    totalVolumeUsd: totalVolume.toFixed(4),
    dailyPnl: "0",
    dailyPnlPercent: 0,
    winRate: null,
    recentActivity: allActivity.slice(0, 15),
    topTokens: allTokens,
    socialActivity: [],
    balanceEth: "0",
    balanceUsd: "0",
    pnlUsd: "0",
    pnlPercent: 0,
    totalTxs,
    tokenCount,
    portfolioValue: "0",
  };
}

export async function buildXOnlyProfile(handle: string): Promise<KOLProfile | null> {
  const xProfile = await fetchXProfile(handle);
  if (!xProfile) return null;

  return {
    address: "",
    name: xProfile.displayName,
    handle,
    avatar: xProfile.avatar,
    description: xProfile.description,
    tags: ["X / Twitter"],
    followers: xProfile.followers,
    influence: null,
    socialScore: null,
    verified: false,
    networks: [],
    totalTokensTraded: 0,
    totalVolumeUsd: "0",
    dailyPnl: "0",
    dailyPnlPercent: 0,
    winRate: null,
    recentActivity: [],
    topTokens: [],
    socialActivity: [],
    balanceEth: "0",
    balanceUsd: "0",
    pnlUsd: "0",
    pnlPercent: 0,
    totalTxs: 0,
    tokenCount: 0,
    portfolioValue: "0",
  };
}

export async function buildFullProfile(
  kol: { address: string; name: string; handle: string | null; description: string; tags: string[]; ethAddresses?: string[] },
  ethPrice: number
): Promise<KOLProfile> {
  const [basicProfile, rhBalance, ethBalance] = await Promise.allSettled([
    kol.address
      ? buildKOLProfileFromRegistry(kol, kol.ethAddresses)
      : buildXOnlyProfile(kol.handle || ""),
    kol.address ? fetchAddressBalance(kol.address, "robinhood") : Promise.resolve(null),
    kol.ethAddresses?.[0] ? fetchAddressBalance(kol.ethAddresses[0], "ethereum") : Promise.resolve(null),
  ]);

  const profile = basicProfile.status === "fulfilled" ? basicProfile.value : null;
  if (!profile) return null as unknown as KOLProfile;

  const rh = rhBalance.status === "fulfilled" ? rhBalance.value : null;
  const eth = ethBalance.status === "fulfilled" ? ethBalance.value : null;

  const totalBalanceEth = Number(rh?.balanceEth || "0") + Number(eth?.balanceEth || "0");
  const totalBalanceUsd = totalBalanceEth * ethPrice;
  const totalTxs = (rh?.txCount || 0) + (eth?.txCount || 0);
  const totalTokens = (rh?.tokenCount || 0) + (eth?.tokenCount || 0);

  return {
    ...profile,
    balanceEth: totalBalanceEth.toFixed(4),
    balanceUsd: totalBalanceUsd.toFixed(2),
    totalTxs,
    tokenCount: totalTokens,
    pnlUsd: "0",
    pnlPercent: 0,
    portfolioValue: totalBalanceUsd.toFixed(2),
    winRate: profile.winRate,
  };
}
