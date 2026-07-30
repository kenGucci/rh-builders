import { NextRequest, NextResponse } from "next/server";

const profileCache = new Map<string, { data: Record<string, unknown>; ts: number }>();
const CACHE_TTL = 300_000;

function buildFallback(handle: string, source: "fallback" | "meta" | "unavatar" | "oembed" = "fallback") {
  return {
    handle,
    profileUrl: `https://x.com/${handle}`,
    displayName: handle,
    avatarUrl: null,
    description: null,
    followers: null,
    following: null,
    bannerUrl: null,
    joinDate: null,
    location: null,
    website: null,
    verified: false,
    tweetCount: null,
    tweetText: null,
    tweetUrl: null,
    tweetDate: null,
    tweetEngagement: null,
    source,
  };
}

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("handle");
  if (!handle) {
    return NextResponse.json({ error: "Missing handle" }, { status: 400 });
  }

  const clean = handle.replace(/^@/, "").trim();
  if (!clean) {
    return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
  }

  const lower = clean.toLowerCase();
  const cached = profileCache.get(lower);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const profileUrl = `https://x.com/${clean}`;

  // Approach 1: Try fetching the profile page meta tags (full profile data)
  try {
    const res = await fetch(profileUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
    });

    if (res.ok) {
      const html = await res.text();

      if (html.includes("This account doesn") || html.includes("page not found") || html.includes("suspended")) {
        const result = buildFallback(clean, "meta");
        profileCache.set(lower, { data: result, ts: Date.now() });
        return NextResponse.json(result);
      }

      let displayName = clean;
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      if (titleMatch) {
        const nameMatch = titleMatch[1].match(/^(.+?)\s*\(@/);
        if (nameMatch) displayName = nameMatch[1].trim();
      }

      let avatarUrl: string | null = null;
      const avatarMatch = html.match(/https:\/\/pbs\.twimg\.com\/profile_images\/[^\s"'<>]+/);
      if (avatarMatch) {
        avatarUrl = avatarMatch[0].replace(/_normal(\.\w+)$/, "_400x400$1").replace(/\?.+$/, "");
      }

      let description: string | null = null;
      const descMatch =
        html.match(/content="([^"]+)"[^>]*property="og:description"/) ||
        html.match(/property="og:description"[^>]*content="([^"]+)"/);
      if (descMatch) description = descMatch[1].substring(0, 300);

      let followers: number | null = null;
      let following: number | null = null;
      const relMatch = html.match(/followers:(\d+),following:(\d+)/);
      if (relMatch) {
        followers = parseInt(relMatch[1]);
        following = parseInt(relMatch[2]);
      }
      if (followers === null) {
        const fMatch = html.match(/"followers_count":(\d+)/);
        if (fMatch) followers = parseInt(fMatch[1]);
      }
      if (following === null) {
        const fMatch = html.match(/"friends_count":(\d+)/);
        if (fMatch) following = parseInt(fMatch[1]);
      }

      let bannerUrl: string | null = null;
      const bannerMatch = html.match(/https:\/\/pbs\.twimg\.com\/profile_banners\/\d+\/\d+\/1500x500/);
      if (bannerMatch) bannerUrl = bannerMatch[0];

      let joinDate: string | null = null;
      const joinDateMatch = html.match(/Joined\s+(\w+\s+\d{4})/i);
      if (joinDateMatch) joinDate = joinDateMatch[1];

      let location: string | null = null;
      const locationMatch = html.match(/"location":"([^"]+)"/);
      if (locationMatch) location = locationMatch[1];

      let website: string | null = null;
      const websiteMatch = html.match(/"url":"(https?:\/\/[^"]+)"/);
      if (websiteMatch) website = websiteMatch[1];

      const verified = html.includes("\"is_blue_verified\":true") || html.includes("verified=true") || html.includes("\"isVerified\":true");

      let tweetCount: number | null = null;
      const tweetMatch = html.match(/"statuses_count":(\d+)/);
      if (tweetMatch) tweetCount = parseInt(tweetMatch[1]);

      const result = {
        handle: clean,
        profileUrl,
        displayName,
        avatarUrl,
        description,
        followers,
        following,
        bannerUrl,
        joinDate,
        location,
        website,
        verified,
        tweetCount,
        tweetText: null,
        tweetUrl: null,
        tweetDate: null,
        tweetEngagement: null,
        source: "meta" as const,
      };

      profileCache.set(lower, { data: result, ts: Date.now() });
      return NextResponse.json(result);
    }
  } catch {}

  // Approach 2: Try oembed for at least avatar + display name
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${profileUrl}&omit_script=true&dnt=true`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(12000) });

    if (res.ok) {
      const data = await res.json();
      const html = data.html || "";

      let avatarUrl: string | null = null;
      const avatarMatch = html.match(/src="(https:\/\/pbs\.twimg\.com\/profile_images\/[^"]+)"/);
      if (avatarMatch) {
        avatarUrl = avatarMatch[1].replace(/_normal(\.\w+)$/, "_400x400$1");
      }

      const result = {
        ...buildFallback(clean, "oembed"),
        displayName: data.author_name || clean,
        avatarUrl,
      };

      profileCache.set(lower, { data: result, ts: Date.now() });
      return NextResponse.json(result);
    }
  } catch {}

  // Approach 3: Try unavatar.io for avatar
  try {
    const unavatarRes = await fetch(`https://unavatar.io/twitter/${clean}`, {
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (unavatarRes.ok) {
      const avatarUrl = unavatarRes.url || null;
      const result = {
        ...buildFallback(clean, "unavatar"),
        avatarUrl,
      };
      profileCache.set(lower, { data: result, ts: Date.now() });
      return NextResponse.json(result);
    }
  } catch {}

  // Final fallback
  return NextResponse.json(buildFallback(clean));
}
