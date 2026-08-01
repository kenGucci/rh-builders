export interface StockToken {
  symbol: string;
  name: string;
  sector: string;
  chain: string;
  multiplier: number;
  backed: boolean;
  custodian: string;
  tokenAddress: string;
  apy: number;
  tvl: number;
}

export const STOCK_TOKENS: StockToken[] = [
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC", apy: 0, tvl: 12500000000 },
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9", apy: 0, tvl: 9800000000 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3", apy: 0, tvl: 8200000000 },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xe93237C50D904957Cf27E7B1133b510C669c2e74", apy: 0, tvl: 7500000000 },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Cyclical", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x12f190a9F9d7D37a250758b26824B97CE941bF54", apy: 0, tvl: 6100000000 },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Cyclical", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d", apy: 0, tvl: 5400000000 },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35", apy: 0, tvl: 4800000000 },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x86923f96303D656E4aa86D9d42D1e57ad2023fdC", apy: 0, tvl: 3200000000 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", sector: "ETF", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xD5f3879160bc7c32ebb4dC785F8a4F505888de68", apy: 0, tvl: 2800000000 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", sector: "ETF", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C", apy: 0, tvl: 2500000000 },
  { symbol: "COIN", name: "Coinbase Global", sector: "Financial", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x6330D8C3178a418788dF01a47479c0ce7CCF450b", apy: 0, tvl: 1200000000 },
  { symbol: "PLTR", name: "Palantir Technologies", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x894E1EC2D74FFE5AEF8Dc8A9e84686acCB964F2A", apy: 0, tvl: 980000000 },
  { symbol: "SOFI", name: "SoFi Technologies", sector: "Financial", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x98E75885157C80992A8D41b696D8c9C6Fb30A926", apy: 0, tvl: 650000000 },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Communication", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xE0444EF8BF4eD74f74FD73686e2ddF4C1c5591E8", apy: 0, tvl: 380000000 },
];

export const STOCK_TOKEN_MAP: Record<string, StockToken> = Object.fromEntries(
  STOCK_TOKENS.map((t) => [t.symbol.toLowerCase(), t])
);

export function findStockToken(query: string): StockToken | null {
  const q = query.trim().toLowerCase();
  if (STOCK_TOKEN_MAP[q]) return STOCK_TOKEN_MAP[q];
  const addr = q.toLowerCase();
  const byAddress = STOCK_TOKENS.find((t) => t.tokenAddress.toLowerCase() === addr);
  if (byAddress) return byAddress;
  const nameNorm = q.replace(/[^a-z0-9]/g, "");
  const byName = STOCK_TOKENS.find((t) => t.name.toLowerCase().replace(/[^a-z0-9]/g, "").includes(nameNorm));
  if (byName) return byName;
  return null;
}
