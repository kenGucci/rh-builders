"use client";

import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import StatsBar from "@/components/StatsBar";
import ClaimHistory from "@/components/ClaimHistory";
import TransactionList from "@/components/TransactionList";
import TokenXAccount from "@/components/TokenXAccount";
import AddressAvatar from "@/components/AddressAvatar";
import { useState, useEffect } from "react";
import { ArrowLeft, Copy, ExternalLink, Layers, User, Coins, Wallet, History, CheckCircle, XCircle, ArrowUpRight, Clock, BarChart3 } from "lucide-react";
import builders from "@/lib/builders.json";

type Tab = "xaccount" | "claims" | "activity";

interface AddressData {
  is_contract: boolean;
  name: string | null;
  token?: { name: string; symbol: string; icon_url?: string } | null;
  ens_domain_name?: string | null;
  coin_balance?: string;
  exchange_rate?: string;
  is_verified?: boolean;
  is_scam?: boolean;
  transaction_count?: number;
}

interface TweetData {
  handle: string;
  profileUrl: string;
  html: string | null;
  author_name: string | null;
  author_url: string | null;
  avatarUrl: string | null;
  tweetText: string | null;
  tweetUrl: string | null;
  tweetDate: string | null;
}

interface CreatorData {
  creator_address: string | null;
  tx_hash: string | null;
}

interface TokenBalanceData {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenIcon: string | null;
  tokenPrice: number;
  tokenMarketCap: number | null;
  tokenVolume24h: number | null;
  holdersCount: number;
  holderBalance: string;
  holderBalanceRaw: string;
  holderBalanceUsd: string;
  tokenTransfers: number;
  isVerified: boolean;
}

function findBuilder(address: string) {
  return builders.builders.find((b) => b.address.toLowerCase() === address.toLowerCase()) || null;
}

function timeAgo(timestamp: string) {
  const ts = timestamp.includes("T") ? new Date(timestamp).getTime() / 1000 : parseInt(timestamp);
  const diff = Date.now() / 1000 - ts;
  if (diff < 0) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtMoney(v: number): string {
  if (!v) return "$0";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

export default function BuilderProfileClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const address = (params.address as string).toLowerCase();
  const caParam = searchParams.get("ca")?.toLowerCase() || null;
  const tabParam = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(tabParam && ["xaccount", "claims", "activity"].includes(tabParam) ? tabParam : "xaccount");
  const [data, setData] = useState<AddressData | null>(null);
  const [copied, setCopied] = useState(false);
  const [tweet, setTweet] = useState<TweetData | null>(null);
  const [tweetLoading, setTweetLoading] = useState(false);
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [tokenBalance, setTokenBalance] = useState<TokenBalanceData | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [devRewards, setDevRewards] = useState<{
    creatorAddress: string | null;
    token: { address: string; name: string; symbol: string; icon: string | null; price: number; holdersCount: number; totalSupply: string; marketCap: string | null; decimals: number } | null;
    creatorBalance: { eth: string; ethUsd: string } | null;
    reward: { tokenAddress: string; tokenName: string; tokenSymbol: string; tokenIcon: string | null; tokenPrice: number; tokenDecimals: number; totalSupply: string; marketCap: string | null; holdersCount: number; holderBalance: string; holderBalanceUsd: string; totalClaimed: string; totalClaimedUsd: string; claimCount: number; lastClaimDate: string | null; isClaimed: boolean; destinationWallet: string | null } | null;
    allDeployedTokens: { tokenAddress: string; tokenName: string; tokenSymbol: string; tokenIcon: string | null; tokenPrice: number; totalSupply: string; marketCap: string | null; holdersCount: number; launchDate: string; reward: { totalClaimed: string; totalClaimedUsd: string; claimCount: number; lastClaimDate: string | null; holderBalance: string; holderBalanceUsd: string } | null }[];
    previousLaunches: { tokenAddress: string; tokenName: string; tokenSymbol: string; tokenIcon: string | null; tokenPrice: number; totalSupply: string; marketCap: string | null; holdersCount: number; launchDate: string; reward: { totalClaimed: string; totalClaimedUsd: string; claimCount: number; lastClaimDate: string | null; holderBalance: string; holderBalanceUsd: string } | null }[];
    transactionHistory: { hash: string; type: string; value: string; timestamp: string; method: string }[];
  } | null>(null);
  const [devRewardsLoading, setDevRewardsLoading] = useState(false);
  const [devEarnings, setDevEarnings] = useState<{
    tokens: {
      tokenAddress: string; tokenName: string; tokenSymbol: string; tokenIcon: string | null;
      tokenPrice: number; marketCap: string | null; holdersCount: number;
      isCreator: boolean; totalClaimed: string; totalClaimedUsd: string; claimCount: number;
      lastClaimDate: string | null; holderBalance: string; holderBalanceUsd: string;
    }[];
    totals: { tokenCount: number; claimedUsd: number; claimedTokens: number; claimCount: number };
    wallet: { ethBalance: string; ethUsd: string; coinPrice: number } | null;
  } | null>(null);
  const [devEarningsLoading, setDevEarningsLoading] = useState(false);
  const [detailData, setDetailData] = useState<{
    tokenBalances: {
      address: string; name: string; symbol: string; balance: string; balanceUsd: string;
      price: number; icon: string | null; holdersCount: number; decimals: number;
      dex: {
        priceUsd: string; priceNative: string; marketCap: number; liquidityUsd: number;
        volume24h: number; volume1h: number; priceChange24h: number; priceChange1h: number;
        buys24h: number; sells24h: number; dex: string; pairAddress: string; url: string;
      } | null;
      creatorReward: {
        totalClaimed: string; totalClaimedUsd: string; claimCount: number;
        lastClaimDate: string | null; holderBalance: string; holderBalanceUsd: string;
        destinationWallet: string | null;
      } | null;
    }[];
    balanceHistory: { timestamp: string; balance: string }[];
  } | null>(null);

  const builder = findBuilder(address);
  const isContract = data?.is_contract ?? false;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/address?address=${address}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch((err) => { if (err.name !== "AbortError") console.error("[profile] Address fetch failed:", err); });
    return () => controller.abort();
  }, [address]);

  useEffect(() => {
    if (!caParam) return;
    const controller = new AbortController();
    setTokenLoading(true);
    fetch(`/api/token-balance?address=${address}&token=${caParam}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { if (d.error) setTokenBalance(null); else setTokenBalance(d); })
      .catch(() => setTokenBalance(null))
      .finally(() => setTokenLoading(false));
    return () => controller.abort();
  }, [address, caParam]);

  useEffect(() => {
    if (!builder?.twitter) return;
    const controller = new AbortController();
    setTweetLoading(true);
    fetch(`/api/twitter?handle=${builder.twitter}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setTweet)
      .catch(() => {})
      .finally(() => setTweetLoading(false));
    return () => controller.abort();
  }, [builder?.twitter]);

  useEffect(() => {
    if (!isContract) return;
    const controller = new AbortController();
    fetch(`/api/contract-creator?address=${address}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setCreator)
      .catch(() => {});
    return () => controller.abort();
  }, [address, isContract]);

  useEffect(() => {
    if (!caParam) return;
    const controller = new AbortController();
    setDevRewardsLoading(true);
    fetch(`/api/developer-rewards?tokenAddress=${caParam}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { if (d.error) setDevRewards(null); else setDevRewards(d); })
      .catch(() => setDevRewards(null))
      .finally(() => setDevRewardsLoading(false));
    return () => controller.abort();
  }, [caParam]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/builder-detail?address=${address}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setDetailData({
          tokenBalances: d.tokenBalances || [],
          balanceHistory: d.balanceHistory || [],
        });
      })
      .catch(() => {})
      .finally(() => {});
    return () => controller.abort();
  }, [address]);

  useEffect(() => {
    if (caParam || isContract) return;
    const controller = new AbortController();
    setDevEarningsLoading(true);
    fetch(`/api/builder-earnings?address=${address}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && !d.error) setDevEarnings(d);
        else setDevEarnings(null);
      })
      .catch(() => setDevEarnings(null))
      .finally(() => setDevEarningsLoading(false));
    return () => controller.abort();
  }, [address, caParam, isContract]);

  const creatorBuilder = creator?.creator_address ? findBuilder(creator.creator_address) : null;

  const totalRewards = detailData?.tokenBalances?.length
    ? detailData.tokenBalances.reduce(
        (acc, t) => {
          if (t.creatorReward) {
            acc.totalClaimedUsd += Number(t.creatorReward.totalClaimedUsd) || 0;
            acc.tokenCount += 1;
            acc.claimCount += t.creatorReward.claimCount || 0;
          }
          return acc;
        },
        { totalClaimedUsd: 0, tokenCount: 0, claimCount: 0 }
      )
    : null;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const label = data?.name || data?.token?.name || builder?.name || null;
  const ethBalance = data?.coin_balance ? (Number(data.coin_balance) / 1e18).toFixed(4) : null;
  const usdBalance = data?.coin_balance && data?.exchange_rate
    ? (Number(data.coin_balance) / 1e18 * Number(data.exchange_rate)).toFixed(2)
    : null;

  return (
    <div className="space-y-6 fade-in">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {data?.is_scam && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-red-400">Warning: Scam Report</div>
            <div className="text-xs text-[var(--text-muted)]">This address has been reported as a scam. Proceed with caution.</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-start gap-4">
          {tweet?.avatarUrl ? (
            <Image
              src={tweet.avatarUrl}
              alt={builder?.name || "Profile"}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full border-2 border-[var(--accent)]/30 flex-shrink-0 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <AddressAvatar address={address} size={64} className="mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold">
                {isContract ? <Layers size={18} className="inline text-[var(--accent)] mr-1.5" /> : <User size={18} className="inline text-[var(--accent)] mr-1.5" />}
                {label || (isContract ? "Contract" : "Builder")}
              </h1>
              {data?.is_verified && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                  Verified
                </span>
              )}
              {data?.is_contract && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Contract</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <a href={`https://robinhoodchain.blockscout.com/address/${address}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors truncate">
                {address}
              </a>
              <button onClick={copyAddress} className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors flex-shrink-0">
                {copied ? <span className="text-[10px] text-[var(--accent)]">Copied!</span> : <Copy size={12} />}
              </button>
              <a href={`https://robinhoodchain.blockscout.com/address/${address}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors flex-shrink-0">
                <ExternalLink size={12} />
              </a>
            </div>
            {caParam && tokenLoading && (
              <div className="flex items-center gap-3 mt-2">
                <div className="h-7 w-32 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
              </div>
            )}
            {caParam && tokenBalance && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-3">
                  {tokenBalance.tokenIcon ? (
                    <Image src={tokenBalance.tokenIcon} alt={tokenBalance.tokenSymbol} width={24} height={24} className="w-6 h-6 rounded-full border border-[var(--border)]" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} />
                  ) : null}
                  {tokenBalance.tokenIcon ? (
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--accent)] flex-shrink-0 hidden">
                      {tokenBalance.tokenSymbol?.slice(0, 2)}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--accent)] flex-shrink-0">
                      {tokenBalance.tokenSymbol?.slice(0, 2)}
                    </div>
                  )}
                  <span className="text-lg font-bold gradient-text">
                    {tokenBalance.holderBalance} ${tokenBalance.tokenSymbol}
                  </span>
                  {Number(tokenBalance.holderBalanceUsd) > 0 && (
                    <span className="text-sm text-[var(--text-muted)]">
                      (${Number(tokenBalance.holderBalanceUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Coins size={11} className="text-[var(--accent)]" />
                    {tokenBalance.tokenTransfers} transfers
                  </span>
                  {tokenBalance.tokenPrice > 0 && (
                    <span>Price: ${tokenBalance.tokenPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                  )}
                  {tokenBalance.holdersCount > 0 && (
                    <span>{tokenBalance.holdersCount.toLocaleString()} holders</span>
                  )}
                  <a
                    href={`https://robinhoodchain.blockscout.com/token/${caParam}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline flex items-center gap-0.5"
                  >
                    View on Blockscout <ExternalLink size={9} />
                  </a>
                </div>
              </div>
            )}
            {caParam && !tokenLoading && !tokenBalance && (
              <div className="mt-2 text-xs text-[var(--text-muted)]">
                Token not found or no balance for this address
              </div>
            )}
            {!caParam && ethBalance && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-lg font-bold gradient-text">Ξ {ethBalance}</span>
                {usdBalance && <span className="text-sm text-[var(--text-muted)]">(${Number(usdBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })})</span>}
              </div>
            )}
            {data?.transaction_count != null && (
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {data.transaction_count.toLocaleString()} transactions on Robinhood Chain
              </div>
            )}
          </div>
        </div>

        {builder?.description && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-2">About {builder.name}</h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{builder.description}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-[var(--text-muted)]">
              {builder.category && <span>Category: <span className="text-[var(--accent)]">{builder.category}</span></span>}
              {builder.website && <a href={builder.website} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Website →</a>}
              {builder.github && <a href={builder.github} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">GitHub →</a>}
              {builder.foundingDate && <span>Founded: {builder.foundingDate}</span>}
              {builder.team && builder.team.length > 0 && <span>Team: {builder.team.join(", ")}</span>}
            </div>
          </div>
        )}

        {builder?.twitter && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
              {tweet?.avatarUrl ? (
                <Image
                  src={tweet.avatarUrl}
                  alt={builder.twitter}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full border border-[var(--border)] object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DA1F2">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{tweet?.author_name || builder.name}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DA1F2">
                    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.06 4.3l-4.15-4.15 1.46-1.46 2.69 2.69 5.75-5.75 1.46 1.46-7.21 7.21z" />
                  </svg>
                </div>
                <a
                  href={`https://x.com/${builder.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--text-muted)] hover:text-[#1DA1F2] transition-colors"
                >
                  @{builder.twitter}
                </a>
              </div>
              <a
                href={`https://x.com/${builder.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1DA1F2] text-xs text-white font-medium hover:bg-[#1a8cd8] transition-colors flex-shrink-0"
              >
                Follow
                <ExternalLink size={10} />
              </a>
            </div>

            <div className="p-4">
              {tweetLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
                  <div className="h-4 w-1/2 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
                  <div className="h-4 w-2/3 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
                </div>
              ) : tweet?.tweetText ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{tweet.tweetText}</p>
                  {tweet.tweetDate && (
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {new Date(tweet.tweetDate).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                  {tweet.tweetUrl && (
                    <a
                      href={tweet.tweetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#1DA1F2] hover:underline"
                    >
                      View on X <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-xs text-[var(--text-muted)] mb-2">No recent tweets</div>
                  <a
                    href={`https://x.com/${builder.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#1DA1F2] hover:underline"
                  >
                    View profile on X →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {builder && builder.tags && builder.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {builder.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                {tag}
              </span>
            ))}
          </div>
        )}

        {isContract && creator?.creator_address && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-xs text-[var(--text-muted)]">Deployed by</div>
              <AddressAvatar address={creator.creator_address} size={24} />
              <a
                href={`/builder/${creator.creator_address}`}
                className="text-xs font-mono text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
              >
                {creator.creator_address.slice(0, 10)}...{creator.creator_address.slice(-6)}
              </a>
              {creatorBuilder?.twitter ? (
                <a
                  href={`https://x.com/${creatorBuilder.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 text-[10px] text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  @{creatorBuilder.twitter}
                </a>
              ) : (
                <a
                  href={`https://robinhoodchain.blockscout.com/address/${creator.creator_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                >
                  Dev Coin Profile <ExternalLink size={8} />
                </a>
              )}
              <a
                href={`https://robinhoodchain.blockscout.com/tx/${creator.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
              >
                TX <ExternalLink size={8} />
              </a>
            </div>
          </div>
        )}

        <StatsBar
          address={address}
          tokenBalance={caParam ? {
            tokenSymbol: tokenBalance?.tokenSymbol || "???",
            holderBalance: tokenBalance?.holderBalance || "0",
            holderBalanceUsd: tokenBalance?.holderBalanceUsd || "0",
            tokenPrice: tokenBalance?.tokenPrice || 0,
            tokenIcon: tokenBalance?.tokenIcon || null,
            tokenName: tokenBalance?.tokenName || "Token",
          } : null}
          totalRewards={!caParam && totalRewards && totalRewards.totalClaimedUsd > 0 ? totalRewards : null}
        />

        {!caParam && (devEarningsLoading || devEarnings) && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
              <Wallet size={14} className="text-[var(--accent)]" />
              <span className="text-sm font-semibold">Developer Rewards</span>
              <span className="text-[10px] text-[var(--text-muted)]">— per-token earnings on Robinhood Chain</span>
              {devEarnings && !devEarningsLoading && (
                <span className="ml-auto text-[9px] text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-blink" />
                  Live
                </span>
              )}
            </div>

            {devEarningsLoading ? (
              <div className="p-6 space-y-3">
                <div className="h-4 w-48 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
                <div className="h-4 w-32 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
                <div className="h-4 w-40 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
              </div>
            ) : devEarnings && devEarnings.tokens.length > 0 ? (
              <div>
                {devEarnings.totals.claimedUsd > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[var(--bg-card)] border-b border-[var(--border)]">
                    <div className="text-left">
                      <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Total ETH Earned</div>
                      <div className="text-lg font-bold gradient-text mt-0.5">Ξ {devEarnings.totals.claimedTokens.toFixed(4)}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Total USD Value</div>
                      <div className="text-lg font-bold gradient-text mt-0.5">${devEarnings.totals.claimedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Tokens Found</div>
                      <div className="text-lg font-bold gradient-text mt-0.5">{devEarnings.tokens.length}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Claims</div>
                      <div className="text-lg font-bold gradient-text mt-0.5">{devEarnings.totals.claimCount}</div>
                    </div>
                  </div>
                )}
                <div className="divide-y divide-[var(--border)]">
                  {devEarnings.tokens.slice(0, 15).map((token) => (
                    <div key={token.tokenAddress} className="p-4 hover:bg-[var(--bg-card-hover)] transition-colors">
                      <div className="flex items-center gap-3">
                        {token.tokenIcon ? (
                          <>
                            <Image src={token.tokenIcon} alt={token.tokenSymbol} width={36} height={36} className="w-9 h-9 rounded-full border border-[var(--border)] object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} />
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center text-xs font-bold text-[var(--accent)] border border-[var(--accent)]/20 flex-shrink-0 hidden">
                              {token.tokenSymbol?.slice(0, 2)}
                            </div>
                          </>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center text-xs font-bold text-[var(--accent)] border border-[var(--accent)]/20 flex-shrink-0">
                            {token.tokenSymbol?.slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold truncate">{token.tokenName}</span>
                            <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] font-mono">{token.tokenSymbol}</span>
                            {token.isCreator && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-0.5 flex-shrink-0">
                                <CheckCircle size={8} /> Creator
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[9px] text-[var(--text-muted)] flex-wrap">
                            {token.tokenPrice > 0 && <span className="text-green-400">${token.tokenPrice.toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>}
                            {Number(token.marketCap) > 0 && <span>MC: {fmtMoney(Number(token.marketCap))}</span>}
                            {token.holdersCount > 0 && <span>{token.holdersCount.toLocaleString()} holders</span>}
                          </div>
                          {Number(token.totalClaimed) > 0 && (
                            <div className="flex items-center gap-3 mt-1.5 p-1.5 rounded-lg bg-green-500/5 border border-green-500/20">
                              <span className="text-[10px] font-mono text-green-400 font-semibold">Ξ {token.totalClaimed}</span>
                              {Number(token.totalClaimedUsd) > 0 && (
                                <span className="text-[10px] text-[var(--text-muted)]">(${Number(token.totalClaimedUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })})</span>
                              )}
                              <span className="text-[10px] text-[var(--text-muted)]">{token.claimCount} claims</span>
                              {token.lastClaimDate && <span className="text-[10px] text-[var(--text-muted)]">· {timeAgo(token.lastClaimDate)}</span>}
                            </div>
                          )}
                          {Number(token.holderBalance) > 0 && (
                            <div className="text-[9px] text-[var(--text-muted)] mt-1">
                              Holds {token.holderBalance} {token.tokenSymbol}
                              {Number(token.holderBalanceUsd) > 0 && ` ($${Number(token.holderBalanceUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })})`}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <a href={`/token/${token.tokenAddress}`} className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-0.5">
                            View <ArrowUpRight size={9} />
                          </a>
                          <a href={`/builder/${address}?ca=${token.tokenAddress}`} className="text-[9px] text-[var(--text-muted)] hover:text-[var(--accent)]">
                            Rewards
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[var(--text-muted)]">No reward tokens found for this developer</div>
            )}
          </div>
        )}

        {detailData && detailData.tokenBalances.length > 0 && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
              <Coins size={14} className="text-[var(--accent)]" />
              <span className="text-sm font-semibold">Token Holdings</span>
              <span className="text-[10px] text-[var(--text-muted)]">({detailData.tokenBalances.length} tokens)</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {detailData.tokenBalances.slice(0, 10).map((token) => (
                <div key={token.address} className="p-4 hover:bg-[var(--bg-card-hover)] transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    {token.icon ? (
                      <Image src={token.icon} alt={token.symbol} width={32} height={32} className="w-8 h-8 rounded-full border border-[var(--border)]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                        {token.symbol?.slice(0, 1) || "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{token.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] font-mono">{token.symbol}</span>
                        {token.dex && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">{token.dex.dex}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-[var(--text-muted)] truncate">{token.address}</span>
                        <button onClick={() => { navigator.clipboard.writeText(token.address); }} className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors flex-shrink-0">
                          <Copy size={9} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold gradient-text">{token.balance} {token.symbol}</div>
                      {Number(token.balanceUsd) > 0 && (
                        <div className="text-[11px] text-[var(--text-muted)]">${Number(token.balanceUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                      )}
                    </div>
                  </div>

                  {token.dex && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-2">
                      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
                        <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Price</div>
                        <div className="text-xs font-mono font-medium mt-0.5">${Number(token.dex.priceUsd).toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                        {token.dex.priceChange24h !== 0 && (
                          <div className={`text-[9px] font-mono ${token.dex.priceChange24h > 0 ? "text-green-400" : "text-red-400"}`}>
                            {token.dex.priceChange24h > 0 ? "+" : ""}{token.dex.priceChange24h.toFixed(1)}%
                          </div>
                        )}
                      </div>
                      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
                        <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">MCap</div>
                        <div className="text-xs font-mono font-medium mt-0.5">
                          {token.dex.marketCap >= 1e6 ? `$${(token.dex.marketCap / 1e6).toFixed(1)}M` : `$${token.dex.marketCap.toLocaleString()}`}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
                        <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Liquidity</div>
                        <div className="text-xs font-mono font-medium mt-0.5">
                          {token.dex.liquidityUsd >= 1e6 ? `$${(token.dex.liquidityUsd / 1e6).toFixed(1)}M` : `$${token.dex.liquidityUsd.toLocaleString()}`}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
                        <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Vol 24h</div>
                        <div className="text-xs font-mono font-medium mt-0.5">
                          {token.dex.volume24h >= 1e6 ? `$${(token.dex.volume24h / 1e6).toFixed(1)}M` : `$${token.dex.volume24h.toLocaleString()}`}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
                        <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Vol 1h</div>
                        <div className="text-xs font-mono font-medium mt-0.5">
                          {token.dex.volume1h >= 1e6 ? `$${(token.dex.volume1h / 1e6).toFixed(1)}M` : `$${token.dex.volume1h.toLocaleString()}`}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
                        <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Buys/Sells 24h</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] font-mono text-green-400">{token.dex.buys24h}</span>
                          <span className="text-[9px] text-[var(--text-muted)]">/</span>
                          <span className="text-[10px] font-mono text-red-400">{token.dex.sells24h}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {token.creatorReward && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/20">
                      <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                      <span className="text-[10px] text-green-400 font-medium">Creator</span>
                      <span className="text-[10px] text-[var(--text-muted)]">·</span>
                      <span className="text-[10px] font-mono text-green-400">{token.creatorReward.totalClaimed} claimed</span>
                      {Number(token.creatorReward.totalClaimedUsd) > 0 && (
                        <span className="text-[10px] text-[var(--text-muted)]">(${token.creatorReward.totalClaimedUsd})</span>
                      )}
                      <span className="text-[10px] text-[var(--text-muted)]">·</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{token.creatorReward.claimCount} claims</span>
                      {token.creatorReward.lastClaimDate && (
                        <span className="text-[10px] text-[var(--text-muted)]">· {timeAgo(token.creatorReward.lastClaimDate)}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <a
                      href={`https://robinhoodchain.blockscout.com/token/${token.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-0.5"
                    >
                      Blockscout <ExternalLink size={8} />
                    </a>
                    {token.dex?.url && (
                      <a
                        href={token.dex.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5"
                      >
                        DexScreener <ExternalLink size={8} />
                      </a>
                    )}
                    <a
                      href={`/builder/${address}?ca=${token.address}`}
                      className="text-[10px] text-[var(--accent)] hover:underline"
                    >
                      View details →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {detailData && detailData.balanceHistory.length > 1 && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-[var(--accent)]" />
              <span className="text-sm font-semibold">Balance History</span>
            </div>
            <MiniChart data={detailData.balanceHistory} />
          </div>
        )}
      </div>

      {caParam && (
        <div className="space-y-4 fade-in">
          {devRewardsLoading ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-[var(--accent)]" />
                <span className="text-sm font-semibold">Developer Rewards</span>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-48 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
                <div className="h-4 w-32 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
                <div className="h-4 w-40 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
              </div>
            </div>
          ) : devRewards ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
                <Wallet size={16} className="text-[var(--accent)]" />
                <span className="text-sm font-semibold">Developer Rewards</span>
                {devRewards.reward?.isClaimed ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400">
                    <CheckCircle size={10} /> Claimed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-400">
                    <XCircle size={10} /> Unclaimed
                  </span>
                )}
              </div>

              <div className="p-4 space-y-4">
                {/* Current Token Full Info */}
                {devRewards.token && (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                    {devRewards.token.icon ? (
                      <>
                        <Image src={devRewards.token.icon} alt={devRewards.token.symbol} width={48} height={48} className="w-12 h-12 rounded-xl border border-[var(--border)]" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} />
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center text-lg font-bold text-[var(--accent)] border border-[var(--accent)]/20 hidden">
                          {devRewards.token.symbol?.slice(0, 2)}
                        </div>
                      </>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center text-lg font-bold text-[var(--accent)] border border-[var(--accent)]/20">
                        {devRewards.token.symbol?.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold">{devRewards.token.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">${devRewards.token.symbol} · {devRewards.token.address?.slice(0, 10)}...{devRewards.token.address?.slice(-6)}</div>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
                          {devRewards.token.holdersCount.toLocaleString()} holders
                        </span>
                        {devRewards.token.totalSupply && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
                            Supply: {Number(devRewards.token.totalSupply) >= 1e18 ? `${(Number(devRewards.token.totalSupply) / 1e18).toFixed(2)}` : devRewards.token.totalSupply}
                          </span>
                        )}
                        {devRewards.token.price > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">
                            ${devRewards.token.price.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={`/token/${devRewards.token.address}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                    >
                      Full Profile <ArrowUpRight size={10} />
                    </a>
                  </div>
                )}

                {/* Current Token Rewards */}
                {devRewards.reward && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">ETH Earned</div>
                      <div className="text-lg font-bold gradient-text mt-1">Ξ {devRewards.reward.totalClaimed}</div>
                      {devRewards.reward.totalClaimedUsd !== "0" && <div className="text-[10px] text-[var(--text-muted)]">${Number(devRewards.reward.totalClaimedUsd).toLocaleString()}</div>}
                    </div>
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Claim Count</div>
                      <div className="text-lg font-bold gradient-text mt-1">{devRewards.reward.claimCount}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">claims</div>
                    </div>
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Holder Balance</div>
                      <div className="text-lg font-bold gradient-text mt-1">{devRewards.reward.holderBalance}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{devRewards.reward.tokenSymbol}</div>
                    </div>
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Last Claim</div>
                      <div className="text-sm font-medium mt-1">{devRewards.reward.lastClaimDate ? timeAgo(devRewards.reward.lastClaimDate) : "Never"}</div>
                    </div>
                  </div>
                )}

                {devRewards.reward?.destinationWallet && (
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Destination Wallet (Last Claim)</div>
                    <a href={`/builder/${devRewards.reward.destinationWallet}`} className="text-xs font-mono text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
                      {devRewards.reward.destinationWallet}
                    </a>
                  </div>
                )}

                {/* All Tokens Deployed by this Developer with Individual Rewards */}
                {devRewards.allDeployedTokens.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Coins size={14} className="text-[var(--accent)]" />
                      <span className="text-xs font-semibold">All Tokens Deployed ({devRewards.allDeployedTokens.length})</span>
                    </div>
                    <div className="space-y-2">
                      {devRewards.allDeployedTokens.map((launch) => (
                        <div key={launch.tokenAddress} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all">
                          {launch.tokenIcon ? (
                            <>
                              <Image src={launch.tokenIcon} alt={launch.tokenSymbol} width={40} height={40} className="w-10 h-10 rounded-full border border-[var(--border)]" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} />
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center text-xs font-bold text-[var(--accent)] border border-[var(--accent)]/20 hidden">
                                {launch.tokenSymbol?.slice(0, 2)}
                              </div>
                            </>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center text-xs font-bold text-[var(--accent)] border border-[var(--accent)]/20">
                              {launch.tokenSymbol?.slice(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold truncate">{launch.tokenName}</span>
                              <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] font-mono">{launch.tokenSymbol}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-[9px] text-[var(--text-muted)]">{launch.holdersCount.toLocaleString()} holders</span>
                              {launch.tokenPrice > 0 && (
                                <span className="text-[9px] text-green-400">${launch.tokenPrice.toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
                              )}
                              {launch.marketCap && (
                                <span className="text-[9px] text-[var(--text-muted)]">MCap: ${Number(launch.marketCap) >= 1e6 ? `${(Number(launch.marketCap) / 1e6).toFixed(2)}M` : Number(launch.marketCap).toLocaleString()}</span>
                              )}
                            </div>
                            {launch.reward && (
                              <div className="flex items-center gap-3 mt-1.5 p-1.5 rounded-lg bg-green-500/5 border border-green-500/20">
                                <span className="text-[9px] font-mono text-green-400">Ξ {launch.reward.totalClaimed}</span>
                                {launch.reward.totalClaimedUsd !== "0" && (
                                  <span className="text-[9px] text-[var(--text-muted)]">(${Number(launch.reward.totalClaimedUsd).toLocaleString()})</span>
                                )}
                                <span className="text-[9px] text-[var(--text-muted)]">{launch.reward.claimCount} claims</span>
                                {launch.reward.lastClaimDate && (
                                  <span className="text-[9px] text-[var(--text-muted)]">{timeAgo(launch.reward.lastClaimDate)}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <a href={`/token/${launch.tokenAddress}`} className="text-[9px] text-[var(--accent)] hover:underline flex items-center gap-0.5">
                              View <ArrowUpRight size={8} />
                            </a>
                            <a href={`/builder/${address}?ca=${launch.tokenAddress}`} className="text-[9px] text-[var(--text-muted)] hover:text-[var(--accent)]">
                              Rewards
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Previous Token Launches Summary (excluding current token) */}
                {devRewards.previousLaunches.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <History size={14} className="text-[var(--accent)]" />
                      <span className="text-xs font-semibold">Previous Token Launches ({devRewards.previousLaunches.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {devRewards.previousLaunches.map((launch) => {
                        const totalRewardUsd = launch.reward ? Number(launch.reward.totalClaimedUsd) : 0;
                        return (
                          <a
                            key={launch.tokenAddress}
                            href={`/builder/${address}?ca=${launch.tokenAddress}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
                          >
                            {launch.tokenIcon ? (
                              <Image src={launch.tokenIcon} alt={launch.tokenSymbol} width={28} height={28} className="w-7 h-7 rounded-full border border-[var(--border)]" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} />
                            ) : null}
                            {launch.tokenIcon ? (
                              <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--accent)] flex-shrink-0 hidden">
                                {launch.tokenSymbol?.slice(0, 2)}
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--accent)] flex-shrink-0">
                                {launch.tokenSymbol?.slice(0, 2)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium truncate">{launch.tokenName}</div>
                              <div className="text-[9px] text-[var(--text-muted)]">{launch.tokenSymbol} · {launch.holdersCount.toLocaleString()} holders</div>
                            </div>
                            {launch.reward && (
                              <div className="text-right flex-shrink-0">
                                <div className="text-[11px] font-mono font-semibold gradient-text">Ξ {launch.reward.totalClaimed}</div>
                                {totalRewardUsd > 0 && (
                                  <div className="text-[9px] text-[var(--text-muted)]">${totalRewardUsd.toLocaleString()}</div>
                                )}
                              </div>
                            )}
                            <ArrowUpRight size={12} className="text-[var(--text-muted)] flex-shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Transaction History */}
                {devRewards.transactionHistory.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-[var(--accent)]" />
                      <span className="text-xs font-semibold">Recent Transactions</span>
                    </div>
                    <div className="space-y-1.5">
                      {devRewards.transactionHistory.slice(0, 10).map((tx, i) => (
                        <a
                          key={`${tx.hash}-${i}`}
                          href={`https://robinhoodchain.blockscout.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-mono text-[var(--foreground)] truncate">
                              {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                            </div>
                            {tx.method && <div className="text-[10px] text-[var(--text-muted)] truncate">{tx.method}</div>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-[11px] font-mono ${tx.type === "outgoing" ? "text-red-400" : "text-green-400"}`}>
                              {tx.type === "outgoing" ? "-" : "+"}{tx.value} ETH
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">{tx.timestamp ? timeAgo(tx.timestamp) : ""}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1">
        {(["xaccount", "claims", "activity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === tab ? "bg-[var(--accent)] text-black shadow-[0_0_12px_var(--accent-glow)]" : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            {tab === "xaccount" && "X Account"}
            {tab === "claims" && "Rewards"}
            {tab === "activity" && "Activity"}
          </button>
        ))}
      </div>

      <div className="fade-in" key={activeTab}>
        {activeTab === "xaccount" && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Official X Account</h2>
            <TokenXAccount
              tokenSymbol={data?.token?.symbol}
              tokenAddress={isContract ? address : undefined}
              builderTwitter={builder?.twitter}
              builderName={builder?.name}
            />
          </section>
        )}
        {activeTab === "claims" && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Rewards & Claims</h2>
            <ClaimHistory address={address} />
          </section>
        )}
        {activeTab === "activity" && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
            <TransactionList address={address} />
          </section>
        )}
      </div>
    </div>
  );
}

function MiniChart({ data }: { data: { timestamp: string; balance: string }[] }) {
  if (data.length < 2) return null;
  const values = data.map((d) => Number(d.balance) / 1e18);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 600;
  const h = 80;
  const padding = 4;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (w - padding * 2);
    const y = h - padding - ((v - min) / range) * (h - padding * 2);
    return `${x},${y}`;
  });

  const areaPoints = `${padding},${h - padding} ${points.join(" ")} ${w - padding},${h - padding}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#chartGrad)" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
