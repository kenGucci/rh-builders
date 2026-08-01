import { NextResponse } from "next/server";

const V2 = "https://robinhoodchain.blockscout.com/api/v2";
const RPC_URL = process.env.RPC_URL || "https://rpc.mainnet.chain.robinhood.com";

export const revalidate = 0;

const MAX_AGE = 60;

let cache: { data: unknown; ts: number } | null = null;
let inflight: Promise<NextResponse> | null = null;

async function fastFetch(url: string, timeoutMs = 10000): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < MAX_AGE * 1000) {
    return NextResponse.json(cache.data, { headers: { "Cache-Control": "s-maxage=15, stale-while-revalidate=30" } });
  }

  if (inflight) return inflight;

  inflight = (async () => {
    let blocks: unknown[] = [];
    let transactions: unknown[] = [];
    let stats: Record<string, unknown> = {};
    let latestBlock = 0;

    try {
      const [statsRes, blocksRes, txsRes, blockRes] = await Promise.allSettled([
        fastFetch(`${V2}/stats`),
        fastFetch(`${V2}/blocks?type=block&items_count=10`),
        fastFetch(`${V2}/main-page/transactions`),
        fetch(RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
          signal: AbortSignal.timeout(8000),
        }),
      ]);

      if (statsRes.status === "fulfilled") stats = (statsRes.value as Record<string, unknown>) || {};
      if (blocksRes.status === "fulfilled") blocks = ((blocksRes.value as Record<string, unknown>).items as unknown[]) || [];
      if (txsRes.status === "fulfilled") {
        const txData = txsRes.value as unknown;
        transactions = Array.isArray(txData) ? (txData as unknown[]) : ((txData as Record<string, unknown>).items as unknown[]) || [];
      }

      if (blockRes.status === "fulfilled" && blockRes.value.ok) {
        const rpcJson = (await blockRes.value.json()) as { result?: string };
        if (rpcJson.result) latestBlock = parseInt(rpcJson.result, 16);
      }
    } catch (err) {
      console.error("[onchain] fetch stage:", err);
    }

    const mappedBlocks = (blocks as Record<string, unknown>[]).slice(0, 10).map((b) => ({
      height: Number(b.height) || 0,
      hash: (b.hash as string) || "",
      timestamp: (b.timestamp as string) || "",
      txCount: Number(b.transactions_count) || 0,
      gasUsed: (b.gas_used as string) || "0",
      gasLimit: (b.gas_limit as string) || "0",
      size: Number(b.size) || 0,
      baseFeePerGas: (b.base_fee_per_gas as string) || "0",
      miner: (b.miner as Record<string, string>)?.hash || "",
    }));

    const mappedTxs = (transactions as Record<string, unknown>[]).slice(0, 20).map((tx) => {
      const from = (tx.from as Record<string, string>) || {};
      const to = (tx.to as Record<string, string>) || {};
      const feeObj = (tx.fee as Record<string, string>) || {};
      const value = Number(tx.value || 0) / 1e18;
      const fee = Number(feeObj.value || 0) / 1e18;
      const txTypes = (tx.tx_types as string[]) || [];
      const isContractCreation = txTypes.includes("contract_creation");
      const isTokenTransfer = (tx.token_transfers as unknown[])?.length > 0;

      let token = null;
      const transfers = tx.token_transfers as Array<{
        token?: { symbol?: string; name?: string; icon_url?: string };
        total?: { value?: string; decimals?: string };
      }> | undefined;
      if (transfers && transfers.length > 0) {
        const t = transfers[0];
        const raw = t.total?.value || "0";
        const decimals = parseInt(t.total?.decimals || "18", 10);
        token = {
          symbol: t.token?.symbol || null,
          name: t.token?.name || null,
          icon: t.token?.icon_url || null,
          amount: Number(raw) / Math.pow(10, decimals),
        };
      }

      return {
        hash: (tx.hash as string) || "",
        from: from.hash || "",
        fromName: from.name || null,
        to: to.hash || "",
        toName: to.name || null,
        value,
        fee,
        status: (tx.status as string) || "ok",
        method: (tx.method as string) || "Transfer",
        block: Number(tx.block_number) || 0,
        timestamp: (tx.timestamp as string) || "",
        type: isContractCreation ? "contract_creation" : isTokenTransfer ? "token_transfer" : "coin_transfer",
        token,
      };
    });

    const gasPrices = (stats.gas_prices as Record<string, number>) || {};
    const result = {
      stats: {
        totalBlocks: Number(stats.total_blocks) || 0,
        totalTransactions: Number(stats.total_transactions) || 0,
        totalAddresses: Number(stats.total_addresses) || 0,
        avgBlockTime: Number(stats.average_block_time) || 0,
        gasPrices,
        coinPrice: Number(stats.coin_price) || 0,
        fees24h: Number(stats.transaction_fees_sum_24h || 0) || 0,
      },
      blocks: mappedBlocks,
      transactions: mappedTxs,
      latestBlock,
      lastUpdated: new Date().toISOString(),
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result, { headers: { "Cache-Control": "s-maxage=15, stale-while-revalidate=30" } });
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
