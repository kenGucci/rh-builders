import { NextResponse } from "next/server";

const ECOSYSTEM_CACHE_TTL = 3600_000;
let cache: { data: EcosystemApp[]; timestamp: number } | null = null;

export interface EcosystemApp {
  name: string;
  description: string;
  url: string;
  logo: string;
  categories: string[];
}

async function fetchEcosystemApps(): Promise<EcosystemApp[]> {
  try {
    const res = await fetch("https://robinhood.com/us/en/chain/ecosystem/", {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();

    const apps: EcosystemApp[] = [];
    const cardRegex = /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>[\s\S]*?<img[^>]*src="(https:\/\/images\.ctfassets\.net\/[^"]+)"[^>]*>[\s\S]*?<div[^>]*class="[^"]*text-xl[^"]*"[^>]*>([^<]+)<\/div>[\s\S]*?<p[^>]*class="[^"]*text-sm[^>]*"[^>]*>([^<]+)<\/p>/g;

    let match;
    while ((match = cardRegex.exec(html)) !== null) {
      const url = match[1];
      const logo = match[2];
      const name = match[3].trim();
      const description = match[4].trim();

      const categories: string[] = [];
      const tagSection = html.slice(match.index, match.index + 2000);
      const tagMatches = tagSection.match(/class="[^"]*badge[^"]*"[^>]*>([^<]+)<\/span>/g);
      if (tagMatches) {
        for (const t of tagMatches) {
          const cat = t.replace(/class="[^"]*badge[^"]*"[^>]*>/, "").replace(/<\/span>/, "").trim();
          if (cat) categories.push(cat);
        }
      }

      if (name && url) {
        apps.push({ name, description, url, logo, categories });
      }
    }

    if (apps.length === 0) {
      return getFallbackApps();
    }

    return apps;
  } catch {
    return getFallbackApps();
  }
}

function getFallbackApps(): EcosystemApp[] {
  const f = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64&scaleFactor=2`;
  return [
    { name: "0x Labs", description: "Infrastructure for moving value onchain...", url: "https://0x.org", logo: f("0x.org"), categories: ["Trading", "Infrastructure"] },
    { name: "1inch", description: "DeFi ecosystem and DEX aggregator for swapping...", url: "https://1inch.io", logo: f("1inch.io"), categories: ["Trading", "Infrastructure"] },
    { name: "Across", description: "Fast, low-fee token bridging and swaps across chains.", url: "https://across.to", logo: f("across.to"), categories: ["Bridge"] },
    { name: "Alchemy", description: "Complete blockchain developer platform for leading fintechs.", url: "https://www.alchemy.com", logo: f("alchemy.com"), categories: ["Infrastructure"] },
    { name: "Allium", description: "Blockchain data infrastructure for institutions.", url: "https://www.allium.so", logo: f("allium.so"), categories: ["Infrastructure", "Analytics"] },
    { name: "Arbitrum", description: "Finance-native blockchain platform for apps and tokenization.", url: "https://arbitrum.io", logo: f("arbitrum.io"), categories: ["Infrastructure"] },
    { name: "OKX Wallet", description: "Self-custody wallet for managing crypto on Robinhood Chain.", url: "https://www.okx.com/web3", logo: f("okx.com"), categories: ["Wallet"] },
    { name: "Pyth Network", description: "High-fidelity oracle network for real-time market data.", url: "https://pyth.network", logo: f("pyth.network"), categories: ["Infrastructure", "Oracle"] },
    { name: "Redstone Oracles", description: "Modular oracle network delivering high-frequency data feeds.", url: "https://redstone.finance", logo: f("redstone.finance"), categories: ["Infrastructure", "Oracle"] },
    { name: "LayerZero", description: "Full-chain interoperability protocol for cross-chain messaging.", url: "https://layerzero.network", logo: f("layerzero.network"), categories: ["Bridge", "Infrastructure"] },
    { name: "Wormhole", description: "Cross-chain messaging protocol for multi-chain applications.", url: "https://wormhole.com", logo: f("wormhole.com"), categories: ["Bridge"] },
    { name: "Safe", description: "Smart account infrastructure for secure asset management.", url: "https://safe.global", logo: f("safe.global"), categories: ["Wallet", "Infrastructure"] },
    { name: "The Graph", description: "Indexing protocol for querying blockchain data efficiently.", url: "https://thegraph.com", logo: f("thegraph.com"), categories: ["Infrastructure", "Analytics"] },
    { name: "Ondo Finance", description: "Tokenized real-world asset protocol bridging TradFi and DeFi.", url: "https://ondo.finance", logo: f("ondo.finance"), categories: ["Lending", "Trading"] },
    { name: "Circle", description: "USDC — the world's leading digital dollar stablecoin on Robinhood Chain.", url: "https://www.circle.com", logo: f("circle.com"), categories: ["Infrastructure", "Stablecoin"] },
  ];
}

export async function GET() {
  if (cache && Date.now() - cache.timestamp < ECOSYSTEM_CACHE_TTL) {
    return NextResponse.json({ apps: cache.data, cached: true }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" } });
  }

  const apps = await fetchEcosystemApps();
  cache = { data: apps, timestamp: Date.now() };

  const categories = Array.from(new Set(apps.flatMap((a) => a.categories))).sort();

  return NextResponse.json({
    apps,
    categories,
    count: apps.length,
    cached: false,
    generatedAt: new Date().toISOString(),
  }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" } });
}
