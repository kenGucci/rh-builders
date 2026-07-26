import { NextResponse } from "next/server";

const V2 = "https://robinhoodchain.blockscout.com/api/v2";

interface DexTx {
  hash: string;
  from: string;
  fromName: string | null;
  to: string | null;
  toName: string | null;
  toIsContract: boolean;
  value: string;
  timestamp: string;
  block_number: number;
  method: string | null;
  status: string | null;
  fee: string;
  tokenSymbol: string | null;
  tokenName: string | null;
  tokenAddress: string | null;
  tokenIcon: string | null;
  tokenAmount: string | null;
  type: "swap" | "transfer" | "contract" | "coin";
}

export async function GET() {
  try {
    const [txRes, tokenRes] = await Promise.allSettled([
      fetch(`${V2}/main-page/transactions`, { signal: AbortSignal.timeout(10000) }),
      fetch(`${V2}/tokens?sort=holders_count&order=desc&limit=10`, { signal: AbortSignal.timeout(10000) }),
    ]);

    let txItems: Record<string, unknown>[] = [];
    let topTokens: Array<{ address_hash: string; symbol: string; name: string; icon_url: string | null; holders_count: number }> = [];

    if (txRes.status === "fulfilled" && txRes.value.ok) {
      const txData = await txRes.value.json();
      txItems = txData.items || [];
    }

    if (tokenRes.status === "fulfilled" && tokenRes.value.ok) {
      const tokenData = await tokenRes.value.json();
      topTokens = (tokenData.items || []).map((t: Record<string, unknown>) => ({
        address_hash: t.address_hash as string,
        symbol: t.symbol as string,
        name: t.name as string,
        icon_url: t.icon_url as string | null,
        holders_count: t.holders_count as number,
      }));
    }

    const txs: DexTx[] = txItems.slice(0, 30).map((tx: Record<string, unknown>) => {
      const from = tx.from as Record<string, unknown> || {};
      const to = tx.to as Record<string, unknown> || {};
      const fee = tx.fee as Record<string, unknown> || {};
      const tokenTransfers = tx.token_transfers as Array<Record<string, unknown>> | undefined;
      const firstTransfer = tokenTransfers?.[0] as Record<string, unknown> | undefined;
      const token = firstTransfer?.token as Record<string, unknown> | undefined;
      const total = firstTransfer?.total as Record<string, unknown> | undefined;

      const isContract = (to.is_contract as boolean) || false;
      const method = (tx.method as string) || "";

      let txType: DexTx["type"] = "coin";
      if (token?.symbol) txType = "transfer";
      if (isContract && method.toLowerCase().includes("swap")) txType = "swap";
      if (isContract && !token?.symbol) txType = "contract";

      return {
        hash: tx.hash as string,
        from: (from.hash as string || "").toLowerCase(),
        fromName: (from.name as string) || (from.ens_domain_name as string) || null,
        to: to.hash ? (to.hash as string).toLowerCase() : null,
        toName: (to.name as string) || (to.ens_domain_name as string) || null,
        toIsContract: isContract,
        value: (tx.value as string) || "0",
        timestamp: tx.timestamp as string,
        block_number: tx.block_number as number,
        method: tx.method as string | null,
        status: tx.status as string | null,
        fee: (fee.value as string) || "0",
        tokenSymbol: (token?.symbol as string) || null,
        tokenName: (token?.name as string) || null,
        tokenAddress: (token?.address as string) || ((firstTransfer?.token as Record<string, unknown>)?.address as string) || null,
        tokenIcon: (token?.icon_url as string) || null,
        tokenAmount: total?.value ? String(total.value) : null,
        type: txType,
      };
    });

    const blockNumber = txs.length > 0 ? txs[0].block_number : 0;

    return NextResponse.json({
      transactions: txs,
      block_number: blockNumber,
      topTokens,
    });
  } catch (err) {
    console.error("[live-activity] Failed:", err);
    return NextResponse.json({ transactions: [], block_number: 0, topTokens: [] });
  }
}
