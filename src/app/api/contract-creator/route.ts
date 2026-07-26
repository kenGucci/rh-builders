import { NextRequest, NextResponse } from "next/server";

const V1 = "https://robinhoodchain.blockscout.com/api";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${V1}?module=contract&action=getcontractcreation&contractaddresses=${address}`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();

    if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
      const creator = data.result[0];
      return NextResponse.json({
        creator_address: creator.contractCreator?.toLowerCase() || null,
        tx_hash: creator.txHash || null,
        block_number: creator.blockNumber || null,
      });
    }

    return NextResponse.json({ creator_address: null, tx_hash: null, block_number: null });
  } catch (err) {
    console.error(`[contract-creator] Failed for ${address}:`, err);
    return NextResponse.json({ creator_address: null, tx_hash: null, block_number: null });
  }
}
