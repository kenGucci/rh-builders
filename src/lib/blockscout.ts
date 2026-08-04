const V1 = "https://robinhoodchain.blockscout.com/api";
const V2 = "https://robinhoodchain.blockscout.com/api/v2";

interface CacheEntry {
  data: unknown;
  ts: number;
}

const cache = new Map<string, CacheEntry>();
const failCache = new Map<string, number>();
const inflight = new Map<string, Promise<unknown>>();

const MAX_CONCURRENCY = 16;
let activeRequests = 0;
const waiters: Array<() => void> = [];

const FAIL_TTL_MS = 20_000;

async function acquire(): Promise<void> {
  if (activeRequests < MAX_CONCURRENCY) {
    activeRequests++;
    return;
  }
  await new Promise<void>((resolve) => waiters.push(resolve));
  activeRequests++;
}

function release(): void {
  activeRequests--;
  const next = waiters.shift();
  if (next) next();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function getCached(url: string, ttlMs: number): unknown | null {
  const entry = cache.get(url);
  if (entry && Date.now() - entry.ts < ttlMs) return entry.data;
  return null;
}

function setCache(url: string, data: unknown): void {
  cache.set(url, { data, ts: Date.now() });
  if (cache.size > 2000) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now - v.ts > 60_000) cache.delete(k);
    }
  }
}

export async function blockscoutFetch(url: string, retries = 2, cacheTtlMs = 60_000): Promise<unknown> {
  const failedAt = failCache.get(url);
  if (failedAt && Date.now() - failedAt < FAIL_TTL_MS) {
    return null;
  }

  const cached = getCached(url, cacheTtlMs);
  if (cached !== null) return cached;

  if (inflight.has(url)) return inflight.get(url)!;

  const promise = (async () => {
    await acquire();
    try {
      for (let attempt = 0; attempt <= retries; attempt++) {
        if (attempt > 0) await sleep(1500 * attempt);
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
          if (res.status === 429) {
            await sleep(2000);
            if (attempt < retries) continue;
            throw new Error(`Rate limited after ${retries} retries`);
          }
          if (res.status === 503 || res.status === 502) {
            await sleep(1500);
            if (attempt < retries) continue;
          }
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          const data = await res.json();
          setCache(url, data);
          return data;
        } catch (err) {
          if (attempt === retries) {
            failCache.set(url, Date.now());
            if (failCache.size > 2000) {
              const now = Date.now();
              for (const [k, v] of failCache) if (now - v > FAIL_TTL_MS) failCache.delete(k);
            }
            throw err;
          }
        }
      }
      throw new Error("Unreachable");
    } finally {
      release();
    }
  })();

  inflight.set(url, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(url);
  }
}

export async function v1Fetch(module: string, action: string, params: Record<string, string>, cacheTtlMs = 60_000): Promise<unknown> {
  const qs = new URLSearchParams({ module, action, ...params }).toString();
  return blockscoutFetch(`${V1}?${qs}`, 2, cacheTtlMs);
}

export async function v2Fetch(path: string, cacheTtlMs = 60_000, retries = 2): Promise<unknown> {
  return blockscoutFetch(`${V2}${path}`, retries, cacheTtlMs);
}

export function v2RecentlyFailed(path: string): boolean {
  const failedAt = failCache.get(`${V2}${path}`);
  return failedAt ? Date.now() - failedAt < FAIL_TTL_MS : false;
}

export { V1, V2 };
