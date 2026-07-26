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

  const profileUrl = `https://x.com/${clean}`;

  // Approach 1: Try oembed for tweet + author data
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

      let tweetText: string | null = null;
      const textMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      if (textMatch) {
        tweetText = textMatch[1].replace(/<[^>]+>/g, "").trim();
      }

      let tweetUrl: string | null = null;
      const urlMatch = html.match(/href="(https?:\/\/(twitter|x)\.com\/[^"]*\/status\/\d+)"/);
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
        profileUrl,
        displayName: data.author_name || clean,
        avatarUrl,
        description: null,
        followers: null,
        following: null,
        bannerUrl: null,
        joinDate: null,
        location: null,
        website: null,
        verified: false,
        tweetCount: null,
        tweetText,
        tweetUrl,
        tweetDate,
        tweetEngagement: null,
        source: "oembed",
      });
    }
  } catch {}

  // Approach 2: Try fetching the profile page meta tags via a lightweight request
  try {
    const res = await fetch(profileUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html",
      },
      redirect: "follow",
    });

    if (res.ok) {
      const html = await res.text();

      if (html.includes("This account doesn") || html.includes("page not found") || html.includes("suspended")) {
        return NextResponse.json({
          handle: clean,
          profileUrl,
          displayName: clean,
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
          source: "meta",
        });
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
      const followersMatch = html.match(/"followers_count":(\d+)/);
      if (followersMatch) followers = parseInt(followersMatch[1]);

      let following: number | null = null;
      const followingMatch = html.match(/"friends_count":(\d+)/);
      if (followingMatch) following = parseInt(followingMatch[1]);

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

      const verified = html.includes("\"is_blue_verified\":true") || html.includes("verified=true");

      let tweetCount: number | null = null;
      const tweetMatch = html.match(/"statuses_count":(\d+)/);
      if (tweetMatch) tweetCount = parseInt(tweetMatch[1]);

      return NextResponse.json({
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
        source: "meta",
      });
    }
  } catch {}

  // Fallback: return handle info with profile link
  return NextResponse.json({
    handle: clean,
    profileUrl,
    displayName: clean,
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
    source: "fallback",
  });
}
