export interface KBEntry {
  id: string;
  keywords: string[];
  emoji: string;
  text: string;
  link?: { href: string; label: string };
}

export interface KBGroup {
  title: string;
  emoji: string;
  entries: KBEntry[];
}

const DASH = { href: "/", label: "Open Dashboard" };
const MKT = { href: "/market", label: "Open Market" };
const GLB = { href: "/global", label: "Open Global" };
const BLD = { href: "/builder", label: "Open Builders" };
const TEAM = { href: "/team", label: "Open Team" };
const SET = { href: "/settings", label: "Open Settings" };
const ABOUT = { href: "/about", label: "Open About" };

export const KB_GROUPS: KBGroup[] = [
  {
    title: "Pages & Navigation",
    emoji: "🧭",
    entries: [
      {
        id: "nav-dashboard",
        keywords: ["dashboard", "home", "main page", "front page", "landing", "start"],
        emoji: "🏠",
        text: "The Dashboard (/) is the home screen. It shows live Robinhood Chain stats — total transactions, blocks, addresses, and block time — plus the developer search bar, live transactions feed, top builders, and market news. Everything is fetched live from the chain.",
        link: DASH,
      },
      {
        id: "nav-market",
        keywords: ["market", "stock token", "stock market", "quotes", "prices", "live price", "trading", "stock price"],
        emoji: "📈",
        text: "The Market (/market) is a real-time dashboard for all 14 Stock Tokens (NVDA, AAPL, GOOGL, MSFT, AMZN, TSLA, META, AMD, QQQ, SPY, COIN, PLTR, SOFI, NFLX). It shows live quotes, gainers/losers, a live transactions feed, the ecosystem app explorer, and detailed token modals with charts.",
        link: MKT,
      },
      {
        id: "nav-global",
        keywords: ["global", "global search", "world search", "everything", "web search", "internet"],
        emoji: "🌍",
        text: "The Global (/global) page searches beyond the chain — web, news, images, videos, and maps. It pulls live results from search engines, Wikipedia, news sources, and image providers, with category tabs and caching for speed.",
        link: GLB,
      },
      {
        id: "nav-builder",
        keywords: ["builder", "developer", "dev", "builders", "creators", "wallets", "wallet lookup", "dev profile"],
        emoji: "🛠️",
        text: "Builders ([/builder]) lets you trace any Robinhood Chain developer. Search a wallet (0x…), a contract address (CA), or an X handle to see the developer profile, their deployed tokens, creator rewards, claim history, X account, and live activity.",
        link: BLD,
      },
      {
        id: "nav-team",
        keywords: ["team", "community", "who", "about us", "company", "founder", "official", "members"],
        emoji: "🤝",
        text: "The Community page (/team) showcases only real, live X profiles — the official THE WALL X account (@officialWALLrh) and the lead. All data is fetched live from X, with followers, join date, location, and verification.",
        link: TEAM,
      },
      {
        id: "nav-settings",
        keywords: ["settings", "language", "theme", "dark mode", "light mode", "configure", "preferences", "setup"],
        emoji: "⚙️",
        text: "Settings (/settings) lets you change the UI language (choose from many languages), switch between light and dark themes, and send feedback.",
        link: SET,
      },
      {
        id: "nav-about",
        keywords: ["about", "whitepaper", "readme", "project", "info", "roadmap", "what is the wall"],
        emoji: "📚",
        text: "About Us (/about) explains THE WALL — a real-time Stock Token marketplace and on-chain analytics dashboard for Robinhood Chain (Chain ID 4663). You'll find the README, WHITEPAPER v1.1, ROADMAP, and GitHub links.",
        link: ABOUT,
      },
      {
        id: "nav-xprofile",
        keywords: ["x profile", "x account", "twitter profile", "profile", "handle", "@", "x.com"],
        emoji: "🐦",
        text: "Search any X handle (like @officialWALLrh) from any search bar and it opens a live X profile page with the banner, avatar, description, followers, following, location, and verification — all fetched live from X.",
      },
      {
        id: "nav-legal",
        keywords: ["legal", "terms", "privacy", "cookie", "cookies", "terms of use", "privacy policy", "cookie policy", "policy"],
        emoji: "⚖️",
        text: "All legal documents are live and linked from Settings → Legal: Terms of Use, Cookie Policy, and Privacy Policy. Each has its own page with the latest revision date.",
        link: { href: "/settings", label: "Open Settings → Legal" },
      },
    ],
  },
  {
    title: "Search",
    emoji: "🔍",
    entries: [
      {
        id: "search-ca",
        keywords: ["contract address", "ca", "token address", "contract", "deployment", "dev ca", "project profile"],
        emoji: "📄",
        text: "Searching a contract address (CA) opens the real project profile. You'll see the token info (symbol, name, holders, supply, price) and the developer who deployed it — trace from token → dev instantly.",
        link: BLD,
      },
      {
        id: "search-x",
        keywords: ["x handle", "handle search", "find on x", "twitter"],
        emoji: "🐦",
        text: "Searching an X handle (e.g. @suggestionii) opens the live X profile with full details: banner, avatar, description, followers, following, location, and verified badge.",
      },
      {
        id: "search-wallet",
        keywords: ["wallet", "address search", "0x", "lookup", "find wallet", "balance"],
        emoji: "💳",
        text: "Searching a wallet address (0x…) opens the developer profile — balance, token holdings, deployed projects, creator rewards, and full on-chain activity. That's the 'dev profile' view.",
        link: BLD,
      },
      {
        id: "search-token",
        keywords: ["stock token", "token name", "find token", "ticker", "symbol", "nvda", "aapl", "tsla", "nvidia", "apple", "tesla", "microsoft", "amazon", "meta", "google", "amazon.com"],
        emoji: "💎",
        text: "You can search by Stock Token symbol or name (NVDA, AAPL, TSLA, GOOGL…) or any on-chain token name. It resolves instantly to the token profile with live price and holder data.",
        link: MKT,
      },
      {
        id: "search-shortcut",
        keywords: ["shortcut", "hotkey", "keyboard", "cmd k", "ctrl k", "command k", "fast search"],
        emoji: "⌨️",
        text: "Press ⌘K (Mac) or Ctrl+K (Windows) anywhere to focus the header search bar instantly. Type a CA, X handle, or wallet and press Enter.",
      },
    ],
  },
  {
    title: "Live Data & Transactions",
    emoji: "⚡",
    entries: [
      {
        id: "live-tx",
        keywords: ["transactions", "tx", "txns", "latest", "recent", "feed", "live transactions", "block explorer"],
        emoji: "⚡",
        text: "Latest Transactions is a live feed updated every ~12-15 seconds. Each row shows sender → receiver, ETH value, token amount, method, status, and a time-ago label. Click any transaction to open it in Blockscout. There's a LIVE badge, a countdown to the next auto-refresh, and a manual Refresh button.",
        link: MKT,
      },
      {
        id: "live-stats",
        keywords: ["stats", "statistics", "total transactions", "blocks", "addresses", "block time", "chain data", "numbers"],
        emoji: "📊",
        text: "The Dashboard shows live chain stats: total transactions, total blocks, addresses, and average block time — with animated counters and sparkline history. Tap the RH price to see it live.",
        link: DASH,
      },
      {
        id: "chain-info",
        keywords: ["chain", "robinhood chain", "chain id", "4663", "network", "rpc", "chain id 4663"],
        emoji: "⛓️",
        text: "THE WALL runs on Robinhood Chain, Chain ID 4663. It's a fast EVM chain with sub-2-second block times. You can inspect any address via the Blockscout explorer from the header.",
      },
      {
        id: "stock-tokens",
        keywords: ["stock token", "stock tokens", "tokenized", "securities", "equity", "13", "14 tokens", "which stocks"],
        emoji: "💎",
        text: "There are 14 Stock Tokens: NVDA, AAPL, GOOGL, MSFT, AMZN, TSLA, META, AMD, QQQ, SPY, COIN, PLTR, SOFI, and NFLX. Each is 1:1 backed by real stock, custody-held, and tradable on-chain. Ask me 'show stock tokens' for live quotes.",
        link: MKT,
      },
      {
        id: "dev-rewards",
        keywords: ["reward", "dev reward", "claims", "claim", "creator reward", "earn", "apy", "royalties"],
        emoji: "💰",
        text: "Developer Rewards shows what a builder earns from their launched tokens — total claimed, claim count, last claim date, and destination wallet. Open any builder profile and check the Rewards tab.",
        link: BLD,
      },
    ],
  },
  {
    title: "Ecosystem & Apps",
    emoji: "🌐",
    entries: [
      {
        id: "ecosystem",
        keywords: ["ecosystem", "apps", "dapps", "launch", "15 apps", "lending", "borrowing", "trading apps", "explore apps"],
        emoji: "🌐",
        text: "Explore the ecosystem on the Market page shows live apps on Robinhood Chain — trading, lending, borrowing, wallets, bridges, oracles, and more. Data syncs live from the Robinhood Chain ecosystem with a filterable category grid. Use the 'View all on Robinhood' link for the full list.",
        link: MKT,
      },
      {
        id: "wallet-connect",
        keywords: ["connect wallet", "wallet", "connect", "metamask", "walletconnect", "login", "sign in", "auth"],
        emoji: "🔐",
        text: "Connect your wallet from the auth page to unlock signing and wallet features. On the Market page you'll also find a swap panel to trade Stock Tokens directly.",
      },
    ],
  },
  {
    title: "UI & Components",
    emoji: "🧩",
    entries: [
      {
        id: "ui-searchbar",
        keywords: ["search bar", "searchbox", "input", "where is search", "find search"],
        emoji: "🔍",
        text: "There are two search bars: a large one on the Dashboard home page and a compact one in the header of every page (⌘K to focus it). Both accept a contract address (CA), an X handle (@…), a wallet (0x…), or a Stock Token name.",
      },
      {
        id: "ui-sidebar",
        keywords: ["sidebar", "menu", "navigation", "links", "left side", "drawer", "mobile menu"],
        emoji: "📑",
        text: "The sidebar on the left has every section: Dashboard, Global, Builders, Market, Team, Settings, and About Us. On mobile it becomes a slide-out drawer opened from the header menu button.",
      },
      {
        id: "ui-theme",
        keywords: ["theme", "dark", "light", "switch theme", "color", "mode"],
        emoji: "🎨",
        text: "The theme switcher (sun/moon) is in the header next to the search bar. You can also set it in Settings → Theme.",
        link: SET,
      },
      {
        id: "ui-statsbar",
        keywords: ["stats bar", "stat card", "counter", "sparkline", "animated counter"],
        emoji: "📊",
        text: "Stat cards on the Dashboard use animated counters and mini sparkline charts that update live with chain metrics.",
      },
      {
        id: "ui-livetx",
        keywords: ["live transactions component", "tx list", "activity feed", "transaction card"],
        emoji: "⚡",
        text: "LiveTransactions renders the real-time transaction feed with status colors (green = ok, red = error), token badges, and hover links to Blockscout.",
      },
      {
        id: "ui-marketboard",
        keywords: ["live board", "market board", "quote card", "ticker", "price card", "stock card"],
        emoji: "📈",
        text: "The Market's LiveBoard renders every Stock Token as a card with live price, change %, volume, market cap, and a 24h chart. Click a card to open the full detail modal.",
        link: MKT,
      },
      {
        id: "ui-builder-tabs",
        keywords: ["builder tabs", "x account", "rewards tab", "activity tab", "tab"],
        emoji: "🗂️",
        text: "Every builder profile has three tabs: X Account (live X posts & profile), Rewards (creator claims & deployed tokens), and Activity (full on-chain activity).",
        link: BLD,
      },
      {
        id: "ui-news",
        keywords: ["news", "headlines", "articles", "market news", "stories"],
        emoji: "📰",
        text: "The News section on the Dashboard pulls live financial and crypto headlines with sources, and links out for the full story.",
        link: DASH,
      },
      {
        id: "ui-swap",
        keywords: ["swap", "trade", "exchange", "buy", "sell", "convert"],
        emoji: "🔄",
        text: "The Market page includes a swap panel to trade Stock Tokens directly on-chain.",
        link: MKT,
      },
      {
        id: "ui-global-tabs",
        keywords: ["category", "web results", "news results", "images", "videos", "maps", "category tabs"],
        emoji: "🗃️",
        text: "The Global page has category tabs — Web, News, Images, Videos, and Maps — each with live results from dedicated sources.",
        link: GLB,
      },
    ],
  },
  {
    title: "Wall Bot",
    emoji: "🤖",
    entries: [
      {
        id: "bot-voice",
        keywords: ["voice", "talk", "speak", "speech", "mic", "microphone", "listen"],
        emoji: "🎙️",
        text: "Wall Bot supports voice! Tap the mic to speak your question, and toggle the speaker to have answers read aloud. Choose a male or female voice in the voice menu.",
      },
      {
        id: "bot-media",
        keywords: ["image", "picture", "photo", "video", "attach", "upload", "media", "file", "understand"],
        emoji: "🖼️",
        text: "You can attach an image or video to Wall Bot. It reads the file (type, size, dimensions) and helps you with it. Full visual recognition activates automatically when a vision API key is configured.",
      },
      {
        id: "bot-emoji",
        keywords: ["emoji", "emojis", "fun", "mood"],
        emoji: "😄",
        text: "Wall Bot answers with emojis to keep things friendly and fast.",
      },
      {
        id: "bot-speed",
        keywords: ["fast", "quick", "instant", "speed", "slow", "think", "thinking"],
        emoji: "⚡",
        text: "Wall Bot answers instantly from its built-in knowledge of the site, and pulls live data (prices, transactions, stats) on demand — no waiting.",
      },
      {
        id: "bot-male-female",
        keywords: ["male", "female", "boy", "girl", "gender", "man", "woman", "voice change"],
        emoji: "🗣️",
        text: "Pick the voice Wall Bot uses when speaking: Male or Female. Your choice is remembered between visits.",
      },
      {
        id: "bot-name",
        keywords: ["name", "who are you", "what are you", "your name", "wall bot", "about you", "help"],
        emoji: "🤖",
        text: "I'm Wall Bot 🤖 — your personal guide to THE WALL. I know every page, component, and feature on this site. Ask me how to search, about Stock Tokens, live prices, transactions, or anything on the site!",
      },
    ],
  },
];

export const FALLBACKS = [
  {
    emoji: "🤔",
    text: "Hmm, I don't know that one yet — but I learn fast! Try asking about: pages (Dashboard, Market, Global), search (CA, X handle, wallet), Stock Tokens, live transactions, the ecosystem, or voice mode.",
  },
  {
    emoji: "🙂",
    text: "I'm not sure about that. I'm an expert on THE WALL though — try 'how does search work?', 'show me the market', 'what is the chain id?', or 'tell me about the team'.",
  },
  {
    emoji: "💡",
    text: "I didn't catch that. I know everything about this website: every page, every component, and every feature. Ask about the Dashboard, Market, Global search, Builders, Team, or Settings.",
  },
];

export const QUICK_REPLIES = [
  { label: "What can you do? 🤖", intent: "help" },
  { label: "How do I search? 🔍", intent: "search-help" },
  { label: "Stock Tokens 💎", intent: "stock-tokens" },
  { label: "Live prices 📈", intent: "prices" },
  { label: "Latest transactions ⚡", intent: "transactions" },
  { label: "Chain stats 📊", intent: "stats" },
  { label: "Open Market 🏦", intent: "nav-market" },
  { label: "Community 🤝", intent: "nav-team" },
];

export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^\w\s@]/g, " ").replace(/\s+/g, " ").trim();
}

export interface MatchResult {
  entry: KBEntry | null;
  score: number;
  groupTitle: string;
  groupEmoji: string;
}

export function matchKnowledge(raw: string): MatchResult {
  const text = normalizeText(raw);
  const tokens = new Set(text.split(" ").filter((t) => t.length > 1));
  let best: MatchResult = { entry: null, score: 0, groupTitle: "", groupEmoji: "" };

  for (const group of KB_GROUPS) {
    for (const entry of group.entries) {
      let score = 0;
      for (const kw of entry.keywords) {
        const nk = normalizeText(kw);
        if (nk === text) {
          score += 20;
        } else if (text.includes(nk)) {
          score += 6;
        } else if (nk.split(" ").every((t) => tokens.has(t))) {
          score += 3;
        }
        // partial single-word keyword containment
        if (!nk.includes(" ") && tokens.has(nk)) score += 2;
      }
      if (score > best.score) {
        best = { entry, score, groupTitle: group.title, groupEmoji: group.emoji };
      }
    }
  }
  return best;
}

export function isHelpRequest(raw: string): boolean {
  const t = normalizeText(raw);
  return /^(\?|help|what can you do|what do you do|how do you work|hello|hi|hey|yo|greetings)$/.test(t) ||
    /^(help|hi|hello|hey|yo|hii+|hell[o0]+|whats up|what's up)$/.test(t);
}

export function isGreeting(raw: string): boolean {
  const t = normalizeText(raw).replace(/[!?.]+$/, "");
  return /^(hi|hello|hey|yo|hiya|good (morning|afternoon|evening)|wassup|sup|hola|greetings)$/.test(t);
}

export function pickFallback(): { emoji: string; text: string } {
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

export const GREETINGS = [
  { emoji: "👋", text: "Hey! I'm Wall Bot 🤖 — your live guide to THE WALL. I know every page, component, and feature here. Ask about Stock Tokens, live prices, transactions, search, the team — or try my voice mode 🎙️." },
  { emoji: "🖤", text: "Welcome to THE WALL! I'm Wall Bot 🤖, here to help you navigate everything — the Dashboard, Market, Global search, Builders, Team, and more. What do you need?" },
];

export const HELP_TEXT =
  "I'm Wall Bot 🤖 — I know EVERYTHING about this site. Try me:\n\n" +
  "• \"how do I search a wallet?\" 💳\n" +
  "• \"show me Stock Tokens\" 💎\n" +
  "• \"live prices\" 📈\n" +
  "• \"latest transactions\" ⚡\n" +
  "• \"chain stats\" 📊\n" +
  "• \"what is the ecosystem?\" 🌐\n" +
  "• \"open the market\" 🏦\n" +
  "• \"tell me about the team\" 🤝\n" +
  "• \"switch to a female voice\" 🗣️\n\n" +
  "I can also speak answers (male/female voice) and accept images & videos 🖼️.";
