import { getBlockNumber, getBlock, getTxReceipt, fetchErc20Meta, KNOWN_TOPICS } from "./rpc";
import {
  addToken,
  getAllTokens,
  pushHolderHistory,
  pushTransferHistory,
  type DetectedToken,
} from "./token-store";

const BLOCKSCOUT = "https://robinhoodchain.blockscout.com/api/v2";
let lastBlock = 0;
let monitoring = false;
let monitorTimer: ReturnType<typeof setInterval> | null = null;

async function apiFetch(url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function enrichFromBlockscout(token: DetectedToken): Promise<void> {
  const data = await apiFetch(`${BLOCKSCOUT}/tokens/${token.address}`);
  if (!data) return;

  if (data.holders_count) token.holders = parseInt(data.holders_count) || 0;
  if (data.exchange_rate) token.exchangeRate = data.exchange_rate;
  if (data.volume_24h) token.volume24h = data.volume_24h;
  if (data.circulating_market_cap) token.marketCap = data.circulating_market_cap;
  if (data.icon_url) token.iconUrl = data.icon_url;
  if (data.creator_address_hash) token.creator = data.creator_address_hash.toLowerCase();
  if (data.total_supply) token.totalSupply = data.total_supply;

  if (data.exchange_rate && data.total_supply) {
    const rate = parseFloat(data.exchange_rate);
    const supply = parseFloat(data.total_supply) / Math.pow(10, token.decimals);
    token.priceUsd = data.exchange_rate;
    token.marketCap = (rate * supply).toFixed(2);
  }

  const holdersData = await apiFetch(`${BLOCKSCOUT}/tokens/${token.address}/holders?limit=1`);
  if (holdersData?.items_count) {
    token.holders = holdersData.items_count;
  }

  const transfersData = await apiFetch(
    `${BLOCKSCOUT}/tokens/${token.address}/transfers?limit=100`
  );
  if (transfersData?.items) {
    token.transferCount = transfersData.items_count || transfersData.items.length;

    const now = Date.now();
    const hourMs = 3600000;
    const buckets = new Array(24).fill(0);
    for (const t of transfersData.items) {
      if (t.timestamp) {
        const age = now - new Date(t.timestamp).getTime();
        const bucket = Math.floor(age / hourMs);
        if (bucket >= 0 && bucket < 24) buckets[23 - bucket]++;
      }
    }
    token.transferHistory = buckets;
  }
}

async function processBlock(blockNum: number): Promise<void> {
  const block = await getBlock(blockNum);

  for (const tx of block.transactions) {
    if (tx.to !== null) continue;

    const receipt = await getTxReceipt(tx.hash);
    if (!receipt || !receipt.contractAddress || receipt.status !== "0x1") continue;

    const contractAddr = receipt.contractAddress.toLowerCase();
    if (!contractAddr) continue;

    const hasTransfer = receipt.logs.some(
      (log) => log.topics[0]?.toLowerCase() === KNOWN_TOPICS.TRANSFER
    );
    if (!hasTransfer) continue;

    const meta = await fetchErc20Meta(contractAddr);
    if (!meta) continue;

    const token: DetectedToken = {
      address: contractAddr,
      name: meta.name || "Unknown",
      symbol: meta.symbol || "???",
      totalSupply: meta.totalSupply,
      decimals: meta.decimals,
      creator: tx.from,
      createdAt: new Date(block.timestamp * 1000).toISOString(),
      blockNumber: blockNum,
      txHash: tx.hash,
      holders: 0,
      explorerUrl: `https://robinhoodchain.blockscout.com/address/${contractAddr}`,
      iconUrl: null,
      volume24h: null,
      exchangeRate: null,
      priceUsd: null,
      marketCap: null,
      ethPriceUsd: null,
      transferCount: 0,
      holderHistory: [],
      transferHistory: [],
      lastUpdated: Date.now(),
    };

    addToken(token);

    enrichFromBlockscout(token).catch((err) => console.error(`[monitor] enrich failed for ${contractAddr}:`, err));
  }
}

async function pollNewBlocks(): Promise<void> {
  try {
    const currentBlock = await getBlockNumber();

    if (lastBlock === 0) {
      lastBlock = currentBlock;
      return;
    }

    if (currentBlock <= lastBlock) return;

    const from = lastBlock + 1;
    const to = Math.min(currentBlock, from + 5);

    for (let blockNum = from; blockNum <= to; blockNum++) {
      await processBlock(blockNum);
    }

    lastBlock = to;
  } catch (err) {
    console.error("[monitor] pollNewBlocks failed:", err);
  }
}

async function refreshMetrics(): Promise<void> {
  const tokens = getAllTokens();
  for (const token of tokens.slice(0, 20)) {
    try {
      const holdersData = await apiFetch(
        `${BLOCKSCOUT}/tokens/${token.address}/holders?limit=1`
      );
      if (holdersData?.items_count !== undefined) {
        token.holders = holdersData.items_count;
        pushHolderHistory(token.address, token.holders);
      }

      const transfersData = await apiFetch(
        `${BLOCKSCOUT}/tokens/${token.address}/transfers?limit=50`
      );
      if (transfersData?.items_count !== undefined) {
        pushTransferHistory(token.address, transfersData.items_count);
      }

      if (token.exchangeRate) {
        const rate = parseFloat(token.exchangeRate);
        const supply = parseFloat(token.totalSupply) / Math.pow(10, token.decimals);
        token.priceUsd = token.exchangeRate;
        token.marketCap = (rate * supply).toFixed(2);
      }
    } catch (err) {
      console.error(`[monitor] refreshMetrics failed for ${token.address}:`, err);
    }
  }
}

export function startMonitoring(): void {
  if (monitoring) return;
  monitoring = true;

  pollNewBlocks();

  monitorTimer = setInterval(() => {
    pollNewBlocks();
  }, 5000);

  setInterval(() => {
    refreshMetrics();
  }, 30000);
}

export function getLatestBlock(): number {
  return lastBlock;
}

export function isMonitoring(): boolean {
  return monitoring;
}
