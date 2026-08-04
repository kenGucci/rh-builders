import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const BLOCKSCOUT_V2 = "https://robinhoodchain.blockscout.com/api/v2";

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 120_000;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const addr = address?.toLowerCase();

  if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const cached = cache.get(addr);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    let j: Record<string, unknown> | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`${BLOCKSCOUT_V2}/addresses/${addr}`, {
          signal: AbortSignal.timeout(25000),
        });
        if (res.ok) {
          j = await res.json();
          break;
        }
        if (res.status === 404) break;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    if (!j) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }
    const data = {
      creator: (j.creator_address_hash as string | null) || null,
      creationTxHash: (j.creation_transaction_hash as string | null) || null,
      isContract: !!j.is_contract,
      name: (j.name as string | null) || null,
    };
    cache.set(addr, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch dev info" }, { status: 500 });
  }
}
