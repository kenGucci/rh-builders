import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const trimmed = q.trim();

  try {
    const url = `https://publish.twitter.com/oembed?url=https://twitter.com/search?q=${encodeURIComponent(trimmed)}&limit=5&omit_script=true&dnt=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      return NextResponse.json({ results: [], error: "Search unavailable" });
    }

    const data = await res.json();
    return NextResponse.json({
      query: trimmed,
      html: data.html || null,
      author_name: data.author_name || null,
      author_url: data.author_url || null,
    });
  } catch {
    return NextResponse.json({ query: trimmed, results: [], error: "Failed to search Twitter" });
  }
}
