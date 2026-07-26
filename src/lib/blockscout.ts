const V1 = "https://robinhoodchain.blockscout.com/api";
const V2 = "https://robinhoodchain.blockscout.com/api/v2";

export async function blockscoutFetch(url: string, retries = 2): Promise<unknown> {
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
      return res.json();
    } catch (err) {
      if (attempt === retries) throw err;
    }
  }
  throw new Error("Unreachable");
}

export async function v1Fetch(module: string, action: string, params: Record<string, string>): Promise<unknown> {
  const qs = new URLSearchParams({ module, action, ...params }).toString();
  return blockscoutFetch(`${V1}?${qs}`);
}

export async function v2Fetch(path: string): Promise<unknown> {
  return blockscoutFetch(`${V2}${path}`);
}

export { V1, V2 };
