import { NextRequest, NextResponse } from "next/server";

export type SearchCategory = "web" | "news" | "images" | "videos" | "maps";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  source?: string;
  thumbnail?: string;
  publishedAt?: string;
  latitude?: number;
  longitude?: number;
}

interface SearchResponse {
  category: SearchCategory;
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  error?: string;
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// ─── In-memory cache ───
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function cachedGet(key: string) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;
  return undefined;
}

function cachedSet(key: string, data: unknown) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// ─── DuckDuckGo HTML scrape (reliable web results) ───
async function searchDdgHtml(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(9000),
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const anchors = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].slice(0, 12);
    const snippets = [...html.matchAll(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)];
    const resultUrls = [...html.matchAll(/<a[^>]*class="result__url"[^>]*>([\s\S]*?)<\/a>/g)];

    return anchors.map((m, i) => {
      const rawHref = decodeEntities(m[1]);
      const uddg = rawHref.match(/[?&]uddg=([^&]+)/)?.[1];
      const url = uddg ? decodeURIComponent(uddg) : rawHref.replace(/^\/\//, "https://");
      return {
        id: `ddg-${i}-${query}`,
        title: decodeEntities(m[2].replace(/<[^>]*>/g, "")),
        description: decodeEntities((snippets[i]?.[1] || "").replace(/<[^>]*>/g, "")).slice(0, 240),
        url,
        source: decodeEntities((resultUrls[i]?.[1] || "").replace(/<[^>]*>/g, "")).trim() || new URL(url).hostname.replace("www.", ""),
      };
    });
  } catch {
    return [];
  }
}

// ─── WEB SEARCH ─── DDG HTML + Wikipedia + DuckDuckGo Instant Answer ───
async function searchWeb(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // 1. DuckDuckGo HTML scrape (primary — reliable, real results)
  const ddgResults = await searchDdgHtml(query);
  results.push(...ddgResults);

  // 2. Wikipedia
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.extract) {
        results.push({
          id: `wiki-${query}`,
          title: data.title || query,
          description: data.extract,
          url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
          source: "Wikipedia",
          thumbnail: data.thumbnail?.source || null,
        });
      }
    }
  } catch {}

  // 3. DuckDuckGo Instant Answer API
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.AbstractText) {
        results.push({
          id: `ddg-${query}`,
          title: data.Heading || query,
          description: data.AbstractText,
          url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          source: data.AbstractSource || "DuckDuckGo",
          thumbnail: data.Image || null,
        });
      }
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, 8)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              id: `ddg-rel-${results.length}-${query}`,
              title: topic.Text.split(" - ")[0] || topic.Text.slice(0, 80),
              description: topic.Text,
              url: topic.FirstURL,
              source: "DuckDuckGo",
              thumbnail: topic.Icon?.URL || null,
            });
          }
        }
      }
    }
  } catch {}

  return results.slice(0, 20);
}

// ─── NEWS SEARCH ─── Google News RSS + BBC + TechCrunch ───
async function searchNews(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // 1. Google News RSS
  try {
    const res = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const xml = await res.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      let count = 0;

      while ((match = itemRegex.exec(xml)) !== null && count < 12) {
        const item = match[1];
        const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") || "";
        const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
        const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "";

        if (title && link) {
          results.push({
            id: `news-${count}-${query}`,
            title: title.replace(/<[^>]*>/g, ""),
            description: `${source ? source + " · " : ""}${pubDate ? new Date(pubDate).toLocaleDateString() : ""}`,
            url: link,
            source: source || "Google News",
            publishedAt: pubDate,
          });
          count++;
        }
      }
    }
  } catch {}

  // 2. BBC News RSS (fallback)
  if (results.length === 0) {
    try {
      const res = await fetch(
        `https://feeds.bbci.co.uk/news/search/rss?q=${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const xml = await res.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        let count = 0;

        while ((match = itemRegex.exec(xml)) !== null && count < 10) {
          const item = match[1];
          const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
          const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
          const desc = item.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")?.replace(/<[^>]*>/g, "") || "";
          const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";

          if (title && link) {
            results.push({
              id: `bbc-${count}-${query}`,
              title: title.replace(/<[^>]*>/g, ""),
              description: desc.slice(0, 200),
              url: link,
              source: "BBC News",
              publishedAt: pubDate,
            });
            count++;
          }
        }
      }
    } catch {}
  }

  // 3. TechCrunch RSS (for tech queries)
  if (results.length === 0) {
    try {
      const res = await fetch(
        `https://techcrunch.com/feed/?s=${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const xml = await res.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        let count = 0;

        while ((match = itemRegex.exec(xml)) !== null && count < 8) {
          const item = match[1];
          const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
          const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
          const desc = item.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")?.replace(/<[^>]*>/g, "") || "";
          const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";

          if (title && link) {
            results.push({
              id: `tc-${count}-${query}`,
              title: title.replace(/<[^>]*>/g, ""),
              description: desc.slice(0, 200),
              url: link,
              source: "TechCrunch",
              publishedAt: pubDate,
            });
            count++;
          }
        }
      }
    } catch {}
  }

  return results.slice(0, 15);
}

// ─── IMAGES SEARCH ─── Pexels API + Wikimedia Commons + DuckDuckGo ───
async function searchCommons(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url&iiurlwidth=320&format=json&origin=*`,
      { signal: AbortSignal.timeout(9000), headers: { "User-Agent": UA } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data?.query?.pages || {};
    const out: SearchResult[] = [];
    for (const page of Object.values(pages) as Array<{ title?: string; imageinfo?: Array<{ thumburl?: string; url?: string }> }>) {
      const ii = page.imageinfo?.[0];
      if (!ii?.thumburl) continue;
      out.push({
        id: `commons-${page.title}`,
        title: (page.title || query).replace(/^File:/, "").replace(/\.[a-zA-Z0-9]+$/, "").replace(/_/g, " "),
        description: "Wikimedia Commons",
        url: ii.url || ii.thumburl,
        source: "Wikimedia Commons",
        thumbnail: ii.thumburl,
      });
    }
    return out.slice(0, 12);
  } catch {
    return [];
  }
}

async function searchImages(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // 1. Pexels API (primary, when key present)
  if (PEXELS_API_KEY) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
        {
          signal: AbortSignal.timeout(8000),
          headers: { Authorization: PEXELS_API_KEY },
        }
      );
      if (res.ok) {
        const data = await res.json();
        for (const photo of data.photos || []) {
          results.push({
            id: `pexels-${photo.id}`,
            title: photo.alt || query,
            description: `Photo by ${photo.photographer} on Pexels`,
            url: photo.url || photo.photographer_url,
            source: "Pexels",
            thumbnail: photo.src?.medium || photo.src?.small || photo.src?.tiny,
          });
        }
      }
    } catch {}
  }

  // 2. Wikimedia Commons (reliable, no key needed)
  if (results.length === 0) {
    const commons = await searchCommons(query);
    results.push(...commons);
  }

  // 3. DuckDuckGo image search (fallback)
  if (results.length === 0) {
    try {
      const res = await fetch(
        `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
        {
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
        }
      );
      if (res.ok) {
        const html = await res.text();
        const imgMatches = html.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|gif|webp)[^"'\s]*/gi);
        if (imgMatches) {
          const unique = [...new Set(imgMatches)].filter((u) => !u.includes("duckduckgo.com") && !u.includes("pixel.")).slice(0, 12);
          for (let i = 0; i < unique.length; i++) {
            results.push({
              id: `ddg-img-${i}-${query}`,
              title: `${query} - Image ${i + 1}`,
              description: `DuckDuckGo image result for ${query}`,
              url: unique[i],
              source: "DuckDuckGo",
              thumbnail: unique[i],
            });
          }
        }
      }
    } catch {}
  }

  // 4. Wikipedia images (final fallback)
  if (results.length === 0) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.thumbnail?.source) {
          results.push({
            id: `wiki-img-${query}`,
            title: `${data.title || query} - Wikipedia`,
            description: data.extract?.slice(0, 200) || "",
            url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
            source: "Wikipedia",
            thumbnail: data.thumbnail.source,
          });
        }
        if (data.originalimage?.source) {
          results.push({
            id: `wiki-orig-${query}`,
            title: `${data.title || query} (Full Resolution)`,
            description: data.extract?.slice(0, 200) || "",
            url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
            source: "Wikipedia",
            thumbnail: data.originalimage.source,
          });
        }
      }
    } catch {}
  }

  return results.slice(0, 18);
}

// ─── VIDEOS SEARCH ─── YouTube scrape + DuckDuckGo fallback ───
async function searchVideos(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // 1. Scrape YouTube search page directly (most reliable)
  try {
    const res = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/var ytInitialData = ({.*?});/);
      if (match) {
        const data = JSON.parse(match[1]);
        const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
        for (const c of contents) {
          const vid = c.videoRenderer;
          if (vid && results.length < 12) {
            const title = vid.title?.runs?.[0]?.text || "";
            const videoId = vid.videoId || "";
            const channel = vid.ownerText?.runs?.[0]?.text || "";
            const viewCount = vid.viewCountText?.simpleText || vid.viewCountText?.runs?.map((r: { text: string }) => r.text).join("") || "";
            const publishedTime = vid.publishedTimeText?.simpleText || "";

            if (title && videoId) {
              results.push({
                id: `yt-${videoId}`,
                title,
                description: `${channel} · ${viewCount}`.trim(),
                url: `https://www.youtube.com/watch?v=${videoId}`,
                source: "YouTube",
                thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                publishedAt: publishedTime,
              });
            }
          }
        }
      }
    }
  } catch {}

  // 2. DuckDuckGo video search (fallback)
  if (results.length === 0) {
    try {
      const res = await fetch(
        `https://duckduckgo.com/?q=${encodeURIComponent(query)}+video&ia=web`,
        {
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
        }
      );
      if (res.ok) {
        const html = await res.text();
        const linkMatches = html.match(/href="(https?:\/\/(?:www\.)?(?:youtube|youtu\.be|vimeo|dailymotion)[^"]+)"/gi);
        if (linkMatches) {
          const unique = [...new Set(linkMatches)].slice(0, 10);
          for (let i = 0; i < unique.length; i++) {
            const url = unique[i].replace(/^href="/, "").replace(/"$/, "");
            const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1];
            results.push({
              id: `ddg-vid-${i}-${query}`,
              title: `${query} - Video ${i + 1}`,
              description: `Video result from DuckDuckGo for ${query}`,
              url,
              source: new URL(url).hostname.replace("www.", ""),
              thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : undefined,
            });
          }
        }
      }
    } catch {}
  }

  // 3. DuckDuckGo Instant Answer fallback
  if (results.length === 0) {
    try {
      const res = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}+video&format=json&no_html=1`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.RelatedTopics) {
          for (const topic of (data.RelatedTopics || []).slice(0, 8)) {
            if (topic.Text && topic.FirstURL) {
              results.push({
                id: `ddg-vid-${results.length}-${query}`,
                title: topic.Text.split(" - ")[0] || topic.Text.slice(0, 80),
                description: topic.Text,
                url: topic.FirstURL,
                source: topic.Result || "DuckDuckGo",
                thumbnail: topic.Icon?.URL || null,
              });
            }
          }
        }
      }
    } catch {}
  }

  return results.slice(0, 15);
}

// ─── MAPS SEARCH ─── Nominatim + OSM embeds ───
async function searchMaps(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1&extratags=1`,
      {
        signal: AbortSignal.timeout(8000),
        headers: {
          "User-Agent": "THE-WALL-RH-Global/1.0 (https://thewall.com)",
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const place of data) {
          const address = place.address || {};
          const parts = [
            address.road,
            address.city || address.town || address.village,
            address.state,
            address.country,
          ].filter(Boolean);

          // Use OSM embed for map thumbnail
          const lat = parseFloat(place.lat);
          const lon = parseFloat(place.lon);
          const thumbnail = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01}%2C${lat - 0.007}%2C${lon + 0.01}%2C${lat + 0.007}&layer=mapnik&marker=${lat}%2C${lon}`;

          results.push({
            id: `map-${place.place_id}-${query}`,
            title: place.display_name?.split(",")[0] || place.name || query,
            description: parts.join(", ") || place.display_name || "",
            url: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`,
            source: "OpenStreetMap",
            latitude: lat,
            longitude: lon,
            thumbnail,
          });
        }
      }
    }
  } catch {}

  // Fallback: append " map" to query
  if (results.length === 0) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + " map")}&format=json&limit=5`,
        {
          signal: AbortSignal.timeout(8000),
          headers: {
            "User-Agent": "THE-WALL-RH-Global/1.0",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          for (const place of data) {
            const lat = parseFloat(place.lat);
            const lon = parseFloat(place.lon);
            results.push({
              id: `map2-${place.place_id}-${query}`,
              title: place.display_name?.split(",")[0] || query,
              description: place.display_name || "",
              url: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`,
              source: "OpenStreetMap",
              latitude: lat,
              longitude: lon,
            });
          }
        }
      }
    } catch {}
  }

  return results.slice(0, 10);
}

const searchHandlers: Record<SearchCategory, (query: string) => Promise<SearchResult[]>> = {
  web: searchWeb,
  news: searchNews,
  images: searchImages,
  videos: searchVideos,
  maps: searchMaps,
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const category = (request.nextUrl.searchParams.get("category") || "web") as SearchCategory;

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const validCategories: SearchCategory[] = ["web", "news", "images", "videos", "maps"];
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const startTime = Date.now();

  const cacheKey = `${category}:${q.trim().toLowerCase()}`;
  const cached = cachedGet(cacheKey) as SearchResponse | undefined;
  if (cached) {
    return NextResponse.json({ ...cached, searchTime: 0, cached: true });
  }

  try {
    const handler = searchHandlers[category];
    const results = await handler(q.trim());
    const searchTime = Date.now() - startTime;

    const response: SearchResponse = {
      category,
      query: q.trim(),
      results,
      totalResults: results.length,
      searchTime,
    };

    cachedSet(cacheKey, response);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({
      category,
      query: q.trim(),
      results: [],
      totalResults: 0,
      searchTime: Date.now() - startTime,
      error: "Search failed. Please try again.",
    });
  }
}
