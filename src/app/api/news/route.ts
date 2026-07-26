import { NextRequest, NextResponse } from "next/server";

interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  thumbnail: string | null;
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, "s"));
  return match ? match[1].trim() : "";
}

function parseGoogleNewsFeed(xml: string): Article[] {
  const items = xml.split("<item>").slice(1);
  return items.map((item) => {
    const title = extractTag(item, "title");
    const description = extractTag(item, "description");
    const link = extractTag(item, "link");
    const pubDate = extractTag(item, "pubDate");
    const source = extractTag(item, "source");

    const cleanUrl = link.replace(/<[^>]*>/g, "").trim();
    const urlMatch = cleanUrl.match(/https?:\/\/[^\s<]+/);

    return {
      id: `gnews-${Buffer.from(title + urlMatch?.[0]).toString("base64").slice(0, 16)}`,
      title: title.replace(/ - [^-]+$/, "").trim(),
      description: description.replace(/<[^>]*>/g, "").trim(),
      url: urlMatch?.[0] || "",
      source: source || "Google News",
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      thumbnail: null,
    };
  });
}

function parseRSSFeed(xml: string, fallbackSource: string): Article[] {
  const items = xml.split("<item>").slice(1);
  return items.map((item) => {
    const title = extractTag(item, "title");
    const description = extractTag(item, "description") || extractTag(item, "content:encoded");
    const link = extractTag(item, "link");
    const pubDate = extractTag(item, "pubDate");
    const dcCreator = extractTag(item, "dc:creator");

    const cleanUrl = link.replace(/<[^>]*>/g, "").trim();

    let thumbnail: string | null = null;
    const mediaMatch = item.match(/<media:content[^>]*url="([^"]+)"/);
    if (mediaMatch) {
      thumbnail = mediaMatch[1];
    }

    return {
      id: `rss-${Buffer.from(title + cleanUrl).toString("base64").slice(0, 16)}`,
      title: title.replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
      description: description.replace(/<[^>]*>/g, "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300),
      url: cleanUrl,
      source: dcCreator || fallbackSource,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      thumbnail,
    };
  });
}

async function fetchWithTimeout(url: string, timeoutMs: number = 10000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") || "crypto robinhood chain";

  const encodedQuery = encodeURIComponent(query);

  const feedUrls = [
    {
      url: `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`,
      parser: (xml: string) => parseGoogleNewsFeed(xml),
      source: "Google News",
    },
    {
      url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
      parser: (xml: string) => parseRSSFeed(xml, "CoinDesk"),
      source: "CoinDesk",
    },
    {
      url: "https://decrypt.co/feed",
      parser: (xml: string) => parseRSSFeed(xml, "Decrypt"),
      source: "Decrypt",
    },
  ];

  const results = await Promise.allSettled(
    feedUrls.map(async (feed) => {
      const xml = await fetchWithTimeout(feed.url);
      if (!xml) return [];
      return feed.parser(xml);
    })
  );

  const allArticles = results
    .filter((r): r is PromiseFulfilledResult<Article[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  const seen = new Set<string>();
  const uniqueArticles: Article[] = [];

  for (const article of allArticles) {
    const key = article.title.toLowerCase().slice(0, 50);
    if (!seen.has(key) && article.title && article.url) {
      seen.add(key);
      uniqueArticles.push(article);
    }
  }

  uniqueArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const limited = uniqueArticles.slice(0, 15);

  return NextResponse.json({
    articles: limited,
    total: limited.length,
    fetchedAt: new Date().toISOString(),
  });
}
