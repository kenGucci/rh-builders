import { findStockToken, liveStockLogoUrl } from "@/lib/stock-tokens";

const cache = new Map<string, { logo: string | null; ts: number }>();
const TTL = 10 * 60_000;

export async function resolveTokenLogo(
  address: string | null | undefined,
  knownIcon?: string | null
): Promise<string | null> {
  const addr = address?.toLowerCase();
  if (!addr) return null;
  if (knownIcon) return knownIcon;

  const cached = cache.get(addr);
  if (cached && Date.now() - cached.ts < TTL) return cached.logo;

  const stock = findStockToken(addr);
  if (stock) {
    const logo = liveStockLogoUrl(stock);
    cache.set(addr, { logo, ts: Date.now() });
    return logo;
  }

  cache.set(addr, { logo: null, ts: Date.now() });
  return null;
}
