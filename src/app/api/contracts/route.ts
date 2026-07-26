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
    const txData = await apiFetch(
      `${V1}?module=account&action=txlist&address=${address}&page=1&offset=1000&sort=desc`
    );

    const txs = Array.isArray(txData.result) ? txData.result : [];
    const contractMap: Record<string, { tx_hash: string; block_number: number; timestamp: string }> = {};

    for (const tx of txs) {
      if (tx.txreceipt_status === "1" && tx.contractAddress && tx.contractAddress !== "") {
        const addr = tx.contractAddress.toLowerCase();
        if (!contractMap[addr]) {
          contractMap[addr] = {
            tx_hash: tx.hash,
            block_number: parseInt(tx.blockNumber) || 0,
            timestamp: tx.timeStamp,
          };
        }
      }
    }

    const contractList = Object.entries(contractMap).map(([addr, data]) => ({
      contract_address: addr,
      ...data,
    }));

    return NextResponse.json({ contracts: contractList });
  } catch (err) {
    console.error(`[contracts] Failed for ${address}:`, err);
    return NextResponse.json({ contracts: [] });
  }
}
