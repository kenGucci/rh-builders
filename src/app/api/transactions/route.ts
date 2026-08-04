import { NextRequest, NextResponse } from "next/server";

const V1 = "https://robinhoodchain.blockscout.com/api";

async function apiFetch(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const v1Data = await apiFetch(
      `${V1}?module=account&action=txlist&address=${address}&page=1&offset=100&sort=desc`
    );

    const rawTxs = Array.isArray(v1Data.result) ? v1Data.result : [];

    const txs = rawTxs.map((tx: Record<string, unknown>) => ({
      hash: tx.hash,
      block_number: parseInt(tx.blockNumber as string) || 0,
      timestamp: tx.timeStamp as string,
      from: (tx.from as string || "").toLowerCase(),
      from_name: null as string | null,
      from_is_contract: false,
      to: tx.to ? (tx.to as string).toLowerCase() : null,
      to_name: null as string | null,
      to_is_contract: false,
      to_tags: [] as string[],
      value: tx.value as string || "0",
      gas_used: tx.gasUsed as string || "0",
      gas_limit: tx.gas as string || "0",
      fee_value: tx.gasUsed && tx.gasPrice
        ? (BigInt(tx.gasUsed as string) * BigInt(tx.gasPrice as string)).toString()
        : "0",
      method: tx.functionName as string || null,
      status: tx.txreceipt_status === "1" ? "ok" : tx.txreceipt_status === "0" ? "error" : null,
      type: null as string | null,
      transaction_types: tx.contractAddress ? ["contract_creation"] : tx.input !== "0x" ? ["contract_call"] : ["coin_transfer"],
      nonce: parseInt(tx.nonce as string) || 0,
      created_contract_address: tx.contractAddress ? (tx.contractAddress as string).toLowerCase() : null,
    }));

    return NextResponse.json({ transactions: txs });
  } catch (err) {
    console.error(`[transactions] Failed for ${address}:`, err);
    return NextResponse.json({ transactions: [] });
  }
}
