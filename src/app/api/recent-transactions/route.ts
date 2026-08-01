import { NextResponse } from "next/server";

const BLOCKSCOUT_V2 = "https://robinhoodchain.blockscout.com/api/v2";

export async function GET() {
  try {
    const res = await fetch(`${BLOCKSCOUT_V2}/main-page/transactions`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Blockscout ${res.status}`);
    const data = await res.json();

    const items = (Array.isArray(data) ? data : data.items || []).slice(0, 25);

    const transactions = items.map((tx: Record<string, unknown>) => {
      const from = (tx.from as Record<string, string>) || {};
      const to = (tx.to as Record<string, string>) || {};
      const rawValue = typeof tx.value === "string" ? tx.value : "0";
      const ethValue = (Number(rawValue) / 1e18).toFixed(4);
      const gasUsed = Number(tx.gas_used || 0);
      const gasPrice = Number(tx.gas_price || 0);
      const feeWei = gasUsed * gasPrice;
      const feeEth = (feeWei / 1e18).toFixed(6);
      const txTypes = (tx.tx_types as string[]) || [];
      const isTokenTransfer = txTypes.includes("token_transfer");
      const isContractCreation = txTypes.includes("contract_creation");

      let tokenInfo = null;
      const transfers = tx.token_transfers as Array<{
        token?: { symbol?: string; name?: string; icon_url?: string; address?: string };
        total?: { value?: string; decimals?: string };
      }> | undefined;
      if (transfers && transfers.length > 0) {
        const t = transfers[0];
        tokenInfo = {
          symbol: t.token?.symbol || null,
          name: t.token?.name || null,
          icon: t.token?.icon_url || null,
          amount: t.total?.value || "0",
        };
      }

      return {
        hash: (tx.hash as string) || "",
        from: from.hash || "",
        to: to.hash || "",
        fromEns: from.name || null,
        toEns: to.name || null,
        value: ethValue,
        fee: feeEth,
        status: (tx.status as string) || "ok",
        method: (tx.method as string) || "Transfer",
        block: Number(tx.block_number || 0),
        timestamp: (tx.timestamp as string) || "",
        type: isContractCreation ? "contract_creation" : isTokenTransfer ? "token_transfer" : "coin_transfer",
        tokenInfo,
        nonce: Number(tx.nonce || 0),
      };
    });

    return NextResponse.json({ transactions });
  } catch {
    return NextResponse.json({ transactions: [] });
  }
}
