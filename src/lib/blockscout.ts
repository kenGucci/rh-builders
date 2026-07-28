const V1 = "https://robinhoodchain.blockscout.com/api";
const V2 = "https://robinhoodchain.blockscout.com/api/v2";

interface CacheEntry {
  data: unknown;
  ts: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

function getCached(url: string, ttlMs: number): unknown | null {
  const entry = cache.get(url);
  if (entry && Date.now() - entry.ts < ttlMs) return entry.data;
  return null;
}

function setCache(url: string, data: unknown): void {
  cache.set(url, { data, ts: Date.now() });
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

export async function blockscoutFetch(url: string, retries = 2, cacheTtlMs = 15_000): Promise<unknown> {
  const cached = getCached(url, cacheTtlMs);
  if (cached !== null) return cached;

  if (inflight.has(url)) return inflight.get(url)!;

  const promise = (async () => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
        if (res.status === 429) {
          if (attempt < retries) continue;
          throw new Error(`Rate limited after ${retries} retries`);
        }
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setCache(url, data);
        return data;
      } catch (err) {
        if (attempt === retries) throw err;
      }
    }
    throw new Error("Unreachable");
  })();

  inflight.set(url, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(url);
  }
}

export async function v1Fetch(module: string, action: string, params: Record<string, string>, cacheTtlMs = 15_000): Promise<unknown> {
  const qs = new URLSearchParams({ module, action, ...params }).toString();
  return blockscoutFetch(`${V1}?${qs}`, 2, cacheTtlMs);
}

export async function v2Fetch(path: string, cacheTtlMs = 15_000): Promise<unknown> {
  return blockscoutFetch(`${V2}${path}`, 2, cacheTtlMs);
}

export { V1, V2 };
