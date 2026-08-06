import { NextRequest, NextResponse } from "next/server";
import { STOCK_TOKEN_MAP } from "@/lib/stock-tokens";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const cache = new Map<string, { data: Buffer; type: string; ts: number }>();
const TTL = 24 * 60 * 60 * 1000;

async function fetchImage(url: string) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { "User-Agent": UA },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(String(res.status));
  const buf = Buffer.from(await res.arrayBuffer());
  const type = res.headers.get("content-type") || "image/png";
  if (!buf.length) throw new Error("empty");
  return { buf, type };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const s = symbol.toUpperCase();
  const token = STOCK_TOKEN_MAP[s.toLowerCase()];
  if (!token) {
    return new NextResponse("Not found", { status: 404 });
  }

  const cached = cache.get(s);
  if (cached && Date.now() - cached.ts < TTL) {
    return new NextResponse(new Uint8Array(cached.data), {
      headers: {
        "Content-Type": cached.type,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }

  const sources = [
    `https://financialmodelingprep.com/image-stock/${s}.png`,
    `https://assets.parqet.com/logos/symbol/${s}`,
  ];

  for (const url of sources) {
    try {
      const { buf, type } = await fetchImage(url);
      cache.set(s, { data: buf, type, ts: Date.now() });
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    } catch {}
  }

  return new NextResponse("Not found", { status: 404 });
}
