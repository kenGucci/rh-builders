import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("handle");
  if (!handle) {
    return NextResponse.json({ error: "Missing handle" }, { status: 400 });
  }

  const clean = handle.replace(/^@/, "").trim();
  if (!clean) {
    return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
  }

  try {
    const url = `https://publish.twitter.com/oembed?url=https://twitter.com/${clean}&limit=1&omit_script=true&dnt=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      return NextResponse.json({
        handle: clean,
        profileUrl: `https://x.com/${clean}`,
        html: null,
        author_name: null,
        author_url: null,
        avatarUrl: null,
        error: "Profile not available",
      });
    }

    const data = await res.json();
    const html = data.html || "";

    let avatarUrl: string | null = null;
    const avatarMatch = html.match(/src="(https:\/\/pbs\.twimg\.com\/profile_images\/[^"]+)"/);
    if (avatarMatch) {
      avatarUrl = avatarMatch[1].replace("normal", "400x400");
    }

    let tweetText: string | null = null;
    const textMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    if (textMatch) {
      tweetText = textMatch[1].replace(/<[^>]+>/g, "").trim();
    }

    let tweetUrl: string | null = null;
    const urlMatch = html.match(/href="(https?:\/\/twitter\.com\/[^"]*\/status\/\d+)"/);
    if (urlMatch) {
      tweetUrl = urlMatch[1];
    }

    let tweetDate: string | null = null;
    const dateMatch = html.match(/datetime="([^"]+)"/);
    if (dateMatch) {
      tweetDate = dateMatch[1];
    }

    return NextResponse.json({
      handle: clean,
      profileUrl: `https://x.com/${clean}`,
      html,
      author_name: data.author_name || null,
      author_url: data.author_url || null,
      avatarUrl,
      tweetText,
      tweetUrl,
      tweetDate,
    });
  } catch (err) {
    console.error(`[twitter] Failed for @${clean}:`, err);
    return NextResponse.json({
      handle: clean,
      profileUrl: `https://x.com/${clean}`,
      html: null,
      author_name: null,
      author_url: null,
      avatarUrl: null,
      tweetText: null,
      tweetUrl: null,
      tweetDate: null,
      error: "Failed to fetch profile",
    });
  }
}
