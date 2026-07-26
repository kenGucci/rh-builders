import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const trimmed = q.trim();

  // Try oembed with a search URL (best effort)
  try {
    const searchUrl = `https://x.com/search?q=${encodeURIComponent(trimmed)}&src=typed_query&f=user`;
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(searchUrl)}&omit_script=true&dnt=true`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(10000) });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        query: trimmed,
        html: data.html || null,
        author_name: data.author_name || null,
        author_url: data.author_url || null,
        profileUrl: `https://x.com/search?q=${encodeURIComponent(trimmed)}&f=user`,
      });
    }
  } catch {}

  return NextResponse.json({
    query: trimmed,
    html: null,
    author_name: null,
    author_url: null,
    profileUrl: `https://x.com/search?q=${encodeURIComponent(trimmed)}&f=user`,
  });
}
