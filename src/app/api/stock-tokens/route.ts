import { NextRequest, NextResponse } from "next/server";

const STOCK_TOKENS = [
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12", apy: 0, tvl: 12500000000 },
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234", apy: 0, tvl: 9800000000 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x3c4d5e6f7890abcdef1234567890abcdef123456", apy: 0, tvl: 8200000000 },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x4d5e6f7890abcdef1234567890abcdef12345678", apy: 0, tvl: 7500000000 },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Cyclical", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x5e6f7890abcdef1234567890abcdef1234567890", apy: 0, tvl: 6100000000 },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Cyclical", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x6f7890abcdef1234567890abcdef1234567890ab", apy: 0, tvl: 5400000000 },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x7890abcdef1234567890abcdef1234567890abcd", apy: 0, tvl: 4800000000 },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x89abcdef1234567890abcdef1234567890abcdef", apy: 0, tvl: 3200000000 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", sector: "ETF", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x9abcdef01234567890abcdef1234567890abcdef1", apy: 0, tvl: 2800000000 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", sector: "ETF", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xabcdef01234567890abcdef1234567890abcdef12", apy: 0, tvl: 2500000000 },
  { symbol: "COIN", name: "Coinbase Global", sector: "Financial", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xbcdef01234567890abcdef1234567890abcdef1234", apy: 0, tvl: 1200000000 },
  { symbol: "PLTR", name: "Palantir Technologies", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xcdef01234567890abcdef1234567890abcdef123456", apy: 0, tvl: 980000000 },
  { symbol: "SOFI", name: "SoFi Technologies", sector: "Financial", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xdef01234567890abcdef1234567890abcdef12345678", apy: 0, tvl: 650000000 },
  { symbol: "SQ", name: "Block Inc.", sector: "Financial", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xef01234567890abcdef1234567890abcdef1234567890", apy: 0, tvl: 540000000 },
  { symbol: "ROKU", name: "Roku Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xf01234567890abcdef1234567890abcdef1234567890ab", apy: 0, tvl: 320000000 },
  { symbol: "DIS", name: "Walt Disney Company", sector: "Communication", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x0123456789abcdef0123456789abcdef0123456789ab", apy: 0, tvl: 410000000 },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Communication", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x123456789abcdef0123456789abcdef0123456789abc", apy: 0, tvl: 380000000 },
  { symbol: "ARM", name: "Arm Holdings", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x23456789abcdef0123456789abcdef0123456789abcd", apy: 0, tvl: 290000000 },
];

const CHAIN_INFO = {
  name: "Robinhood Chain",
  chainId: 4663,
  blockExplorer: "robinhoodchain.blockscout.com",
  nativeCurrency: "ETH",
};

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") || "list";
  const sector = request.nextUrl.searchParams.get("sector");
  const symbol = request.nextUrl.searchParams.get("symbol");

  try {
    if (action === "detail" && symbol) {
      const token = STOCK_TOKENS.find((t) => t.symbol === symbol.toUpperCase());
      if (!token) return NextResponse.json({ error: "Token not found" }, { status: 404 });
      return NextResponse.json({ token, chain: CHAIN_INFO });
    }

    let tokens = [...STOCK_TOKENS];
    if (sector && sector !== "all") {
      tokens = tokens.filter((t) => t.sector.toLowerCase() === sector.toLowerCase());
    }

    const sectors = [...new Set(STOCK_TOKENS.map((t) => t.sector))];
    const totalTvl = STOCK_TOKENS.reduce((sum, t) => sum + t.tvl, 0);

    return NextResponse.json({
      tokens,
      sectors,
      chain: CHAIN_INFO,
      summary: {
        totalTokens: STOCK_TOKENS.length,
        totalTvl,
        sectors: sectors.length,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stock tokens" }, { status: 500 });
  }
}
