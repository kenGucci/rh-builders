import { NextRequest, NextResponse } from "next/server";
import { resolveTokenLogo } from "@/lib/token-logos";

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
          token_icon: (token?.icon_url as string) || null,
          token_decimals: token?.decimals || "18",
          token_type: token?.type || "ERC-20",
          type: "receive",
          usd_value: total?.usd || null,
        };
      });

    const uniqueTokens = new Set(
      claims
        .map((c: { token_address: string | null }) => c.token_address)
        .filter(Boolean) as string[]
    );
    await Promise.all(
      Array.from(uniqueTokens).map(async (addr) => {
        const knownIcon = claims.find(
          (c: { token_address: string | null; token_icon: string | null }) =>
            c.token_address?.toLowerCase() === addr.toLowerCase()
        )?.token_icon;
        const logo = await resolveTokenLogo(addr, knownIcon || null);
        for (const c of claims) {
          if (c.token_address?.toLowerCase() !== addr.toLowerCase()) continue;
          if (logo) c.token_icon = logo;
          if (c.usd_value !== null && c.usd_value !== undefined) continue;
          c.usd_value = await usdForAmount(
            addr,
            c.amount,
            c.token_decimals
          );
        }
      })
    );

    return NextResponse.json({ claims });
  } catch (err) {
    console.error(`[claims] Failed for ${address}:`, err);
    return NextResponse.json({ claims: [] });
  }
}

const usdPriceCache = new Map<string, number>();

async function usdForAmount(
  address: string,
  rawAmount: string,
  decimals: string
): Promise<string | null> {
  const addr = address.toLowerCase();
  try {
    let price = usdPriceCache.get(addr);
    if (!price) {
      const res = await fetch(`${V2}/tokens/${addr}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { exchange_rate?: string };
      price = Number(data?.exchange_rate);
      if (!price || !isFinite(price)) return null;
      usdPriceCache.set(addr, price);
    }
    const d = parseInt(decimals) || 18;
    const amount = Number(BigInt(rawAmount || "0")) / 10 ** d;
    if (!isFinite(amount) || amount <= 0) return null;
    const usd = amount * price;
    return String(usd);
  } catch {
    return null;
  }
}
