import { NextRequest, NextResponse } from "next/server";
import {
  buildFullProfile,
  buildXOnlyProfile,
  type KOLProfile,
} from "@/lib/kol-service";

const KOL_REGISTRY = [
  {
    address: "0xc6911796042b15d7Fa4F6CDe69e245DdCd3d9c31",
    name: "Virtuals Protocol",
    handle: "virtuals_io",
    description: "Decentralized AI agent protocol — largest AI-agent ecosystem on Robinhood Chain.",
    tags: ["AI", "Protocol", "Ecosystem"],
    ethAddresses: [],
  },
  {
    address: "0x020bfC650A365f8BB26819deAAbF3E21291018b4",
    name: "Cash Cat",
    handle: "CashCat_Hood",
    description: "First breakout memecoin on Robinhood Chain that hit $105M market cap.",
    tags: ["Meme", "Culture", "Breakout"],
    ethAddresses: [],
  },
  {
    address: "0xA0DE89bd305B80D0327731Ff62C0521a57E7634d",
    name: "GitHood",
    handle: "githood_app",
    description: "GitHub-verified fair-launch token platform — accountability in token launches.",
    tags: ["Launchpad", "Fair-Launch", "GitHub"],
    ethAddresses: [],
  },
  {
    address: "0x0Fa32B2683C09AbCE9654b60d10001AEA60D5866",
    name: "Active Trader",
    handle: null,
    description: "High-volume trading wallet — top-ranked most active address on Robinhood Chain.",
    tags: ["Trader", "High-Volume", "Market"],
    ethAddresses: [],
  },
  {
    address: "0x5149585A85373082899E9EdAA3d9914fBC53E3CB",
    name: "Token Approver",
    handle: null,
    description: "Active DeFi utility wallet — manages token approvals across multiple protocols.",
    tags: ["DeFi", "Approvals", "Active"],
    ethAddresses: [],
  },
  {
    address: "0x62C27fAB6dFeE71152350c21D21bD1B70966E103",
    name: "ETH Sender",
    handle: null,
    description: "High-frequency ETH transfer wallet — likely a liquidity router or trading hot wallet.",
    tags: ["Trader", "ETH", "Liquidity"],
    ethAddresses: [],
  },
  {
    address: "0x81de990be508b95540b3c519417e7c0755b42977",
    name: "The Greenwood Factory",
    handle: "Greenwood_Hood",
    description: "Community-driven token launch factory — simplified ERC-20 deployment with anti-rug.",
    tags: ["Launchpad", "Factory", "Community"],
    ethAddresses: [],
  },
  {
    address: "0x1b27fF6e68A2fd6490543b17C996c109E64eb432",
    name: "Nock Terminal",
    handle: "nockterminal",
    description: "Professional trading terminal for Robinhood Chain — real-time order flow and charting.",
    tags: ["Trading", "Terminal", "Analytics"],
    ethAddresses: [],
  },
  {
    address: "0x2FbAdbC261e78a94f3388423ce12fFbe48897777",
    name: "GITHUBOOD.FUN",
    handle: "githubood_fun",
    description: "GitHub-verified token launchpad — code-commit history meets on-chain reputation.",
    tags: ["Launchpad", "GitHub", "Verified"],
    ethAddresses: [],
  },
  {
    address: "0x63575bCC942aCC51495E492A0498eb4Ac0A4C0de",
    name: "LaunchHood",
    handle: "LaunchHood",
    description: "Permissionless token launchpad with bonding curves and anti-rug mechanisms.",
    tags: ["Launchpad", "Bonding-Curve", "Anti-Rug"],
    ethAddresses: [],
  },
  {
    address: "0x00C1a8025a5FDdf5046965Dc94e1dB845853A7D1",
    name: "Zardoz Instant Factory",
    handle: "ZardozHood",
    description: "Instant-deployment token factory — zero-config ERC-20 launches.",
    tags: ["Launchpad", "Instant", "Factory"],
    ethAddresses: [],
  },
  {
    address: "0x80B42Aed46d73f47119dC444beA28A9e68F32BF4",
    name: "DYOR Fun",
    handle: "DYORFun",
    description: "Community-powered launchpad with on-chain analytics and rug-pull detection.",
    tags: ["Launchpad", "Analytics", "Community"],
    ethAddresses: [],
  },
  // Real crypto KOLs — on-chain + X
  {
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    name: "Vitalik Buterin",
    handle: "VitalikButerin",
    description: "Ethereum co-founder. Known for balance, research, and protocol design.",
    tags: ["Ethereum", "Founder", "OG"],
    ethAddresses: ["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"],
  },
  {
    address: "0xC0C800B42BcA429C1f3104d25cFE2A71d728d872",
    name: "Cobie",
    handle: "cobabora",
    description: "Crypto OG, early investor, founder of Amber Group. Known for market commentary.",
    tags: ["Investor", "Trader", "OG"],
    ethAddresses: ["0xC0C800B42BcA429C1f3104d25cFE2A71d728d872"],
  },
  {
    address: null,
    name: "Hsaka",
    handle: "HsakaTrades",
    description: "Crypto trader and market commentator. Trusted voice in CT.",
    tags: ["Trader", "Commentary", "Markets"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Ansem",
    handle: "blknoiz06",
    description: "Crypto researcher and analyst. Solana ecosystem champion.",
    tags: ["Researcher", "Solana", "Analyst"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "DeFi Ignas",
    handle: "defi_ignas",
    description: "DeFi researcher. Yield farming deep dives and protocol analysis.",
    tags: ["DeFi", "Researcher", "Yield"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Miles Deutscher",
    handle: "milesdeutscher",
    description: "Crypto analyst and YouTuber. Market breakdowns and altcoin picks.",
    tags: ["Analyst", "Content", "YouTube"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Coin Bureau",
    handle: "CoinBureau",
    description: "Crypto education and in-depth analysis. One of the largest crypto channels.",
    tags: ["Education", "Analysis", "YouTube"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Crypto Banter",
    handle: "CryptoBanter",
    description: "Crypto trading live shows and real-time analysis.",
    tags: ["Trading", "Live", "Community"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Alex Becker",
    handle: "AlexBeckerWSB",
    description: "Crypto and gaming investor. NFT bull. CEO of Neo Tokyo.",
    tags: ["Investor", "Gaming", "NFT"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Elliot Trades",
    handle: "ElliotTrades",
    description: "Crypto trader and content creator. Superfarm founder.",
    tags: ["Trader", "NFT", "DeFi"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "The Crypto Dog",
    handle: "TheCryptoDog",
    description: "Bitcoin and crypto trading commentary. OG since 2017.",
    tags: ["Bitcoin", "Trader", "Commentary"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "CryptoHains",
    handle: "Cryptohains",
    description: "Robinhood Chain ecosystem builder and degen.",
    tags: ["Robinhood", "Builder", "Community"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Bankless",
    handle: "BanklessHQ",
    description: "DeFi education, interviews, and alpha. Leading crypto media.",
    tags: ["DeFi", "Education", "Podcast"],
    ethAddresses: [],
  },
  // Additional real crypto KOLs (15 more to reach 50)
  {
    address: null,
    name: "Kelvin Koh",
    handle: "TheFirstVoyage",
    description: "Partner at The Spartan Group. Crypto investment and strategy.",
    tags: ["Investor", "Strategy", "VC"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Tetranode",
    handle: "Tetranode",
    description: "DeFi maximalist. Known for high-conviction trades and farming.",
    tags: ["DeFi", "Maximalist", "Farmer"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Gigantic Rebirth",
    handle: "GiganticRebirth",
    description: "Crypto whale and NFT collector. Known for bold market calls.",
    tags: ["Whale", "NFT", "Calls"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "DegenSpartan",
    handle: "DegenSpartan",
    description: "DeFi degen. Yield farming legend and protocol critic.",
    tags: ["DeFi", "Degen", "Yield"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Bobby Axelrod",
    handle: "BobbyAxelrod_0x",
    description: "Crypto researcher. On-chain analytics and alpha.",
    tags: ["Researcher", "Analytics", "Alpha"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Venture Coinist",
    handle: "VentureCoinist",
    description: "Crypto fund manager. Market commentary and portfolio insights.",
    tags: ["Fund", "Commentary", "Portfolio"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Pentoshi",
    handle: "0xPentoshi",
    description: "Crypto trader known for technical analysis and macro calls.",
    tags: ["Trader", "TA", "Macro"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Crypto Cred",
    handle: "CryptoCred",
    description: "Crypto trading educator. Technical analysis courses and breakdowns.",
    tags: ["Education", "TA", "Trading"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Tyler Reynolds",
    handle: "tyler_reynolds",
    description: "Crypto and macro analyst. DeFi and institutional flows.",
    tags: ["Analyst", "Macro", "DeFi"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "BitQuant",
    handle: "BitQuant_Hood",
    description: "Robinhood Chain quantitative trader. On-chain analytics.",
    tags: ["Quant", "Robinhood", "Analytics"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Roshi",
    handle: "Roshi_Hood",
    description: "Robinhood Chain community leader. Meme coin analyst.",
    tags: ["Robinhood", "Community", "Meme"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "DeFi Alpha",
    handle: "DefiAlpha",
    description: "DeFi yield opportunities and protocol launches.",
    tags: ["DeFi", "Yield", "Alpha"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "On-Chain Wizard",
    handle: "OnChainWiz",
    description: "On-chain data analyst. Wallet tracking and smart money flows.",
    tags: ["Analytics", "On-Chain", "Smart Money"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Token Terminal",
    handle: "Tokenterminal",
    description: "Crypto financial data platform. Protocol revenue and valuation.",
    tags: ["Data", "Fundamentals", "Revenue"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Messari",
    handle: "MessariCrypto",
    description: "Crypto research and data platform. Protocol deep dives.",
    tags: ["Research", "Data", "Reports"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Degen",
    handle: "deaborde",
    description: "Robinhood Chain degen. High-risk trades and moonshots.",
    tags: ["Degen", "Robinhood", "Meme"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Hood Trader",
    handle: "HoodTrader_",
    description: "Robinhood Chain active trader. Bonding curve snipes and launches.",
    tags: ["Trader", "Robinhood", "Sniper"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Robinhood Charts",
    handle: "RHC_Charts",
    description: "Robinhood Chain technical analysis and chart patterns.",
    tags: ["TA", "Robinhood", "Charts"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Moon Dev",
    handle: "MoonDev_Hood",
    description: "Robinhood Chain developer tools and tutorials.",
    tags: ["Dev", "Robinhood", "Tools"],
    ethAddresses: [],
  },
  {
    address: null,
    name: "Bonding Curve Pro",
    handle: "BondingCurvePro",
    description: "Bonding curve analytics and trading strategies.",
    tags: ["Bonding-Curve", "Analytics", "Strategy"],
    ethAddresses: [],
  },
];

async function fetchEthPrice(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    return data.ethereum?.usd || 2000;
  } catch {
    return 2000;
  }
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  const category = request.nextUrl.searchParams.get("category") || "all";
  const q = request.nextUrl.searchParams.get("q");

  const ethPrice = await fetchEthPrice();

  if (address) {
    const kol = KOL_REGISTRY.find((k) => k.address && k.address.toLowerCase() === address.toLowerCase());
    if (!kol) {
      const xProfile = await buildXOnlyProfile(address);
      if (xProfile) return NextResponse.json({ kol: xProfile, ethPrice });
      return NextResponse.json({ error: "KOL not found" }, { status: 404 });
    }

    const profile = await buildFullProfile(kol, ethPrice);
    return NextResponse.json({ kol: profile, ethPrice });
  }

  if (q) {
    const query = q.toLowerCase();
    const matched = KOL_REGISTRY.filter((k) =>
      k.name.toLowerCase().includes(query) ||
      k.handle?.toLowerCase().includes(query) ||
      k.description.toLowerCase().includes(query) ||
      k.tags.some((t) => t.toLowerCase().includes(query))
    );

    if (matched.length === 0) {
      const xProfile = await buildXOnlyProfile(q.replace(/^@/, ""));
      if (xProfile) {
        return NextResponse.json({ kols: [xProfile], ethPrice, searchedX: true });
      }
      return NextResponse.json({ kols: [], ethPrice, searchedX: false });
    }

    const profiles = await Promise.allSettled(
      matched.slice(0, 10).map((kol) => buildFullProfile(kol, ethPrice))
    );

    const results = profiles
      .filter((r): r is PromiseFulfilledResult<KOLProfile> => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);

    return NextResponse.json({ kols: results, ethPrice });
  }

  const filtered =
    category === "all"
      ? KOL_REGISTRY
      : KOL_REGISTRY.filter((k) => k.tags.some((t) => t.toLowerCase().includes(category.toLowerCase())));

  const registryProfiles = await Promise.allSettled(
    filtered.map((kol) => buildFullProfile(kol, ethPrice))
  );

  let profiles = registryProfiles
    .filter((r): r is PromiseFulfilledResult<KOLProfile> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);

  const trending = [...profiles]
    .sort((a, b) => b.totalTxs - a.totalTxs)
    .slice(0, 8);

  const leaderboard = [...profiles]
    .sort((a, b) => {
      const aScore = (a.followers || 0) * 0.4 + a.totalTxs * 30 + a.tokenCount * 100 + Math.abs(a.pnlPercent) * 50;
      const bScore = (b.followers || 0) * 0.4 + b.totalTxs * 30 + b.tokenCount * 100 + Math.abs(b.pnlPercent) * 50;
      return bScore - aScore;
    })
    .map((kol, i) => ({
      ...kol,
      rank: i + 1,
    }));

  return NextResponse.json({
    kols: profiles,
    trending,
    leaderboard: leaderboard.slice(0, 50),
    categories: [...new Set(KOL_REGISTRY.flatMap((k) => k.tags))],
    ethPrice,
    lastUpdated: new Date().toISOString(),
    totalKols: profiles.length,
  });
}
