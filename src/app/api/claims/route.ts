import { NextRequest, NextResponse } from "next/server";

const V2 = "https://robinhoodchain.blockscout.com/api/v2";

async function apiFetch(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Blockscout error: ${res.status}`);
  return res.json();
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const data = await apiFetch(
      `${V2}/addresses/${address.toLowerCase()}/token-transfers`
    );

    const claims = (data.items || [])
      .filter((t: Record<string, unknown>) => {
        const to = t.to as Record<string, unknown> | undefined;
        return (to?.hash as string)?.toLowerCase() === address.toLowerCase();
      })
      .map((t: Record<string, unknown>) => {
        const token = t.token as Record<string, unknown> | undefined;
        const from = t.from as Record<string, unknown>;
        const total = t.total as Record<string, unknown>;
        return {
          tx_hash: t.transaction_hash,
          block_number: t.block_number,
          timestamp: t.timestamp,
          from: from?.hash || "",
          from_name: from?.name || from?.ens_domain_name || null,
          to: address.toLowerCase(),
          amount: total?.value || t.value || "0",
          token_symbol: token?.symbol || "???",
          token_name: token?.name || "Unknown",
          token_address: token?.address_hash || null,
          token_icon: token?.icon_url || null,
          token_decimals: token?.decimals || "18",
          token_type: token?.type || "ERC-20",
          type: "receive",
          usd_value: total?.usd || null,
        };
      });

    return NextResponse.json({ claims });
  } catch (err) {
    console.error(`[claims] Failed for ${address}:`, err);
    return NextResponse.json({ claims: [] });
  }
}
