import { NextRequest, NextResponse } from "next/server";

const BLOCKSCOUT_V2 = "https://robinhoodchain.blockscout.com/api/v2";

interface TransferItem {
  tx_hash: string | null;
  timestamp: string;
  method: string | null;
  type: string;
  total?: { value: string; decimals: string };
  from: { hash: string; name: string | null; is_contract: boolean };
  to: { hash: string; name: string | null; is_contract: boolean };
  token: { symbol: string | null; address: string | null };
}

interface CleanTransfer {
  txHash: string | null;
  timestamp: string;
  method: string | null;
  type: string;
  value: number;
  from: { hash: string; name: string | null; isContract: boolean };
  to: { hash: string; name: string | null; isContract: boolean };
  symbol: string | null;
}

const cache = new Map<string, { data: CleanTransfer[]; ts: number }>();
const CACHE_TTL = 10_000;

function formatValue(raw: string, decimals: string): number {
  const dec = parseInt(decimals, 10) || 18;
  if (!raw) return 0;
  const num = Number(BigInt(raw)) / 10 ** dec;
  return num >= 1e9 ? Math.round(num / 1e6) / 1e3 : Math.round(num);
}

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
    return NextResponse.json({ transfers: cached.data });
  }

  try {
    const res = await fetch(`${BLOCKSCOUT_V2}/tokens/${addr}/transfers`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ transfers: [] });
    }

    const data = await res.json();
    const transfers: CleanTransfer[] = (data.items || [])
      .slice(0, 15)
      .map((it: TransferItem) => ({
        txHash: it.tx_hash || null,
        timestamp: it.timestamp,
        method: it.method || null,
        type: it.type,
        value: formatValue(it.total?.value ?? "", it.total?.decimals ?? ""),
        from: {
          hash: it.from?.hash || "",
          name: it.from?.name || null,
          isContract: Boolean(it.from?.is_contract),
        },
        to: {
          hash: it.to?.hash || "",
          name: it.to?.name || null,
          isContract: Boolean(it.to?.is_contract),
        },
        symbol: it.token?.symbol || null,
      }));

    cache.set(addr, { data: transfers, ts: Date.now() });
    return NextResponse.json({ transfers });
  } catch {
    return NextResponse.json({ transfers: [] });
  }
}
