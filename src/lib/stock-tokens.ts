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
  logo?: string;
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
  { symbol: "GME", name: "GameStop Corp.", sector: "Consumer Cyclical", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x1b0E319c6A659F002271B69dB8A7df2F911c153E", apy: 0, tvl: 520000000 },
  { symbol: "USO", name: "United States Oil Fund", sector: "ETF", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xa30FA36Db767ad9eD3f7a60fC79526fB4d56D344", apy: 0, tvl: 410000000 },
  { symbol: "SGOV", name: "iShares 0-3 Month Treasury Bond ETF", sector: "ETF", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x92FD66527192E3e61d4DDd13322Aa222DE86F9B5", apy: 0, tvl: 390000000 },
  { symbol: "SLV", name: "iShares Silver Trust", sector: "ETF", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x411eFb0E7f985935DAec3D4C3ebaEa0d0AD7D89f", apy: 0, tvl: 360000000 },
  { symbol: "INTC", name: "Intel Corporation", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xc72b96e0E48ecd4DC75E1e45396e26300BC39681", apy: 0, tvl: 310000000 },
  { symbol: "MU", name: "Micron Technology", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xfF080c8ce2E5feadaCa0Da81314Ae59D232d4afD", apy: 0, tvl: 290000000 },
  { symbol: "CRCL", name: "Circle Internet Group", sector: "Financial", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xdF0992E440dD0be65BD8439b609d6D4366bf1CB5", apy: 0, tvl: 270000000 },
  { symbol: "ORCL", name: "Oracle Corporation", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xb0992820E760d836549ba69BC7598b4af75dEE03", apy: 0, tvl: 250000000 },
  { symbol: "CRWV", name: "CoreWeave", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x5f10A1C971B69e47e059e1dC91901B59b3fB49C3", apy: 0, tvl: 230000000 },
  { symbol: "BE", name: "Bloom Energy", sector: "Industrials", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x822CC93fFD030293E9842c30BBD678F530701867", apy: 0, tvl: 210000000 },
  { symbol: "BABA", name: "Alibaba Group Holding", sector: "Consumer Cyclical", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xad25Ac6C84D497db898fa1E8387bf6Af3532a1c4", apy: 0, tvl: 200000000 },
  { symbol: "TSM", name: "Taiwan Semiconductor Manufacturing", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x58FfE4a942d3885bAa22D7520691F611EF09e7AA", apy: 0, tvl: 190000000 },
  { symbol: "RDDT", name: "Reddit Inc.", sector: "Communication", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x05b37Fb53A299a1b874A619e1c4C404D52C36F4C", apy: 0, tvl: 180000000 },
  { symbol: "COST", name: "Costco Wholesale", sector: "Consumer Defensive", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x4EA005168D7F09a7A0Ba9D1DEf21a479950E44C2", apy: 0, tvl: 175000000 },
  { symbol: "MSTR", name: "Strategy Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xec262a75e413fAfD0dF80480274532C79D42da09", apy: 0, tvl: 170000000 },
  { symbol: "RBLX", name: "Roblox Corporation", sector: "Communication", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xF0C4BF4C582cb3836e98394b1d4e7B7281101bE8", apy: 0, tvl: 160000000 },
  { symbol: "RKLB", name: "Rocket Lab USA", sector: "Industrials", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x3b14C39E89D60D627b42a1A4CA45b5bb45Fc12e2", apy: 0, tvl: 155000000 },
  { symbol: "DELL", name: "Dell Technologies", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x941AE714EC6D8130c7B75d67160Ca08f1e7d11Dd", apy: 0, tvl: 150000000 },
  { symbol: "TTWO", name: "Take-Two Interactive Software", sector: "Communication", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x5e81213613b6B86EaB4c6c50d718d34359459786", apy: 0, tvl: 145000000 },
  { symbol: "QCOM", name: "Qualcomm Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x0f17206447090e464C277571124dD2688E48AEA9", apy: 0, tvl: 140000000 },
  { symbol: "ASML", name: "ASML Holding NV", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x47F93d52cBeC7C6D2CfC080e154002370a60dAEA", apy: 0, tvl: 135000000 },
  { symbol: "APLD", name: "Applied Digital", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xb8DBf92F9741c9ac1c32115E78581f23509916FD", apy: 0, tvl: 130000000 },
  { symbol: "LUNR", name: "Intuitive Machines", sector: "Industrials", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xa5D4968421bA94814Be3B136b15cf422101aC1a3", apy: 0, tvl: 125000000 },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x156E175DD063a8cE274C50654eF40e0032b3fbcF", apy: 0, tvl: 120000000 },
  { symbol: "ASTS", name: "AST SpaceMobile", sector: "Communication", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x1AF6446f07eb1d97c546AFC8c9544cBDF3AD5137", apy: 0, tvl: 115000000 },
  { symbol: "QUBT", name: "Quantum Computing Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x59818904ab4cE163b3cE4FfB64f2D6Ca02c434B4", apy: 0, tvl: 110000000 },
  { symbol: "RDW", name: "Redwire Corporation", sector: "Industrials", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x92Ef19E82bD8fF36661DE838D5eaE7e5CEF0EfFE", apy: 0, tvl: 105000000 },
  { symbol: "PENG", name: "Penguin Solutions", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x9b23573b156B52565012F5cE02CDF60AFBaa70Be", apy: 0, tvl: 100000000 },
  { symbol: "LLY", name: "Eli Lilly and Company", sector: "Healthcare", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x8005d266423c7ea827372c9c864491e5786600ea", apy: 0, tvl: 95000000 },
  { symbol: "AMAT", name: "Applied Materials", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x36046893810a7E7fCE501229d57dc3FC8c8716d0", apy: 0, tvl: 90000000 },
  { symbol: "NOW", name: "ServiceNow Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x0C3260aF4B8f13a69c4c2dFb84fD667890CDFa14", apy: 0, tvl: 85000000 },
  { symbol: "NBIS", name: "Nebius Group", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x9D9c6684F596F66a64C030B93A886D51Fd4D7931", apy: 0, tvl: 82000000 },
  { symbol: "SHOP", name: "Shopify Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xF53F66751B1Eff985311b693531E3290F600c410", apy: 0, tvl: 80000000 },
  { symbol: "EWY", name: "iShares MSCI South Korea ETF", sector: "ETF", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x7f0aBeF0C07280F82c6a08ead09dEd6BAE2C13Fc", apy: 0, tvl: 78000000 },
  { symbol: "IREN", name: "IREN Limited", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xF0AB0c93bE6F41369d302e55db1A96b3c430212D", apy: 0, tvl: 76000000 },
  { symbol: "RGTI", name: "Rigetti Computing", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x284358abc07F9359f19f4b5b4aC91901Be2597Ba", apy: 0, tvl: 74000000 },
  { symbol: "MRVL", name: "Marvell Technology", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x62fd0668e10D8B72339BE2DCF7643001688ff13B", apy: 0, tvl: 72000000 },
  { symbol: "NNE", name: "Nano Nuclear Energy", sector: "Utilities", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xBEF75684C43c4ea7BD18Dd532a2244674Ee8b926", apy: 0, tvl: 70000000 },
  { symbol: "XOM", name: "Exxon Mobil", sector: "Energy", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xf9B46d3D1B22199D4D1025a9cEDB540A33F1a2d5", apy: 0, tvl: 68000000 },
  { symbol: "SOXX", name: "iShares Semiconductor ETF", sector: "ETF", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x75742c18BC1f1C5c5f448f4C9D9C6F66dafAAa38", apy: 0, tvl: 66000000 },
  { symbol: "SMCI", name: "Super Micro Computer", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xc01aA1fECeC0605b13bc84874ff7256C0f5F562a", apy: 0, tvl: 64000000 },
  { symbol: "IONQ", name: "IonQ Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x558378E000D634A36593E338eBacdd6207640EfE", apy: 0, tvl: 62000000 },
  { symbol: "CLSK", name: "CleanSpark Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xcBB95BBF36099d34dA091dc6Fa6F49EfA257Cee3", apy: 0, tvl: 60000000 },
  { symbol: "AAOI", name: "Applied Optoelectronics", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x521Cf887E6531c6F667b5BC4D896E5d9bfE8EB2E", apy: 0, tvl: 58000000 },
  { symbol: "LITE", name: "Lumentum Holdings", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x8eF20885F94e3D9bc7eB3080279188Bd5ED7c08C", apy: 0, tvl: 56000000 },
  { symbol: "MXL", name: "MaxLinear Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x48961813349333209994750ffA89b3c5C22eC969", apy: 0, tvl: 54000000 },
  { symbol: "GLW", name: "Corning Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x7c04E6A3368F2A1DE3874f0e80d2e0A1a9915da6", apy: 0, tvl: 52000000 },
  { symbol: "XLK", name: "Technology Select Sector SPDR ETF", sector: "ETF", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x15Cd20759CE7F3285c29A319dE2D1A2e098c6f43", apy: 0, tvl: 50000000 },
  { symbol: "UPS", name: "United Parcel Service", sector: "Industrials", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xf23250dac154D05Bb671CB0d0eBEf3c635c79CE2", apy: 0, tvl: 48000000 },
  { symbol: "SPMO", name: "Invesco S&P 500 Momentum ETF", sector: "ETF", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xAd622320e520de39e72d41EF07438C3Fd3354875", apy: 0, tvl: 46000000 },
  { symbol: "NVTS", name: "Navitas Semiconductor", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xbE6702d7b70315376dC48a3293f24f0982F86386", apy: 0, tvl: 44000000 },
  { symbol: "INOD", name: "Innodata Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xf1953DAB6FaD537488d5A022361FfAa8B4c95eC6", apy: 0, tvl: 42000000 },
  { symbol: "QBTS", name: "D-Wave Quantum", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xC583c60aeF9Dc401Da72cEC1B404743a93cea1Cc", apy: 0, tvl: 40000000 },
  { symbol: "TSEM", name: "Tower Semiconductor", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x89776d4Cd68193597A2fC132cfaC1fDe36CCeA8a", apy: 0, tvl: 38000000 },
  { symbol: "FLNC", name: "Fluence Energy", sector: "Utilities", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x282e87451E10fA6679BC7D76C69BE44cD3fC777C", apy: 0, tvl: 36000000 },
  { symbol: "BA", name: "The Boeing Company", sector: "Industrials", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x4D21483a44Bf67a86b77E3dA301411880797D452", apy: 0, tvl: 34000000 },
  { symbol: "UMC", name: "United Microelectronics", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x0E6e67Ba88e7b5d9B67636A215c76779B948dE79", apy: 0, tvl: 32000000 },
  { symbol: "PR", name: "Permian Resources", sector: "Energy", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x4189F0c66EBBB0bfeF1C31f763131361EF32f77C", apy: 0, tvl: 30000000 },
  { symbol: "CCL", name: "Carnival Corporation", sector: "Consumer Cyclical", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x9651342CeA770aE9a2969Ba2A52611523146aef9", apy: 0, tvl: 28000000 },
  { symbol: "XNDU", name: "Xanadu Quantum", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xA8eB3BCcbf2017eE7CBfb652eB51CF2E1B153289", apy: 0, tvl: 26000000 },
  { symbol: "CELH", name: "Celsius Holdings", sector: "Consumer Defensive", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x8cF07C5A878945185d327aAa6e33FAa95F95e7bF", apy: 0, tvl: 24000000 },
  { symbol: "RIVN", name: "Rivian Automotive", sector: "Consumer Cyclical", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xB1BF26c1D20ff267A4f93550d1E0d06ac40a114B", apy: 0, tvl: 22000000 },
  { symbol: "DDOG", name: "Datadog Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x27c99fBde9D0d2AA4f4Bfb4943f237843DdF6958", apy: 0, tvl: 20000000 },
  { symbol: "ZM", name: "Zoom Communications", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x44c4F142009036cF477eD2d09932051843137CF1", apy: 0, tvl: 18000000 },
  { symbol: "LULU", name: "Lululemon Athletica", sector: "Consumer Cyclical", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x4e62068525Ab11FE768e29dfD00ef909B9803016", apy: 0, tvl: 16000000 },
  { symbol: "ZS", name: "Zscaler Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x7dc013eB55e436f30d7ED1AFE4E36d6e45e3c3f7", apy: 0, tvl: 14000000 },
  { symbol: "F", name: "Ford Motor Company", sector: "Consumer Cyclical", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x25C288E6D899b9BC30160965aD9644c67e73bE0C", apy: 0, tvl: 12000000 },
  { symbol: "FUTU", name: "Futu Holdings", sector: "Financial", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xeB30663bDFf0622Ef4e4E5cBb4E975F19f33f51D", apy: 0, tvl: 10000000 },
  { symbol: "INTU", name: "Intuit Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x56d23beE5f41A7120170b0c603Dae30128e460e9", apy: 0, tvl: 9000000 },
  { symbol: "SATS", name: "EchoStar Corporation", sector: "Communication", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x95052ddcd5DC25641657424A8Cf04834997E1730", apy: 0, tvl: 8000000 },
  { symbol: "ELF", name: "e.l.f. Beauty", sector: "Consumer Defensive", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x39EC44Bee4F6A116c6F9B8De566848a985C53C60", apy: 0, tvl: 7000000 },
  { symbol: "CBRS", name: "Cerebras Systems", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x5c90450Bbb4273D7b2f17CF6917AEB237A569679", apy: 0, tvl: 6000000 },
  { symbol: "WDAY", name: "Workday Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x82DA4646242e1D962e96e932269Dc644c94a9CaA", apy: 0, tvl: 5000000 },
  { symbol: "MDB", name: "MongoDB Inc.", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xDdf2266b79abf0B48898959B0ed6E6adf512be74", apy: 0, tvl: 4000000 },
  { symbol: "POET", name: "POET Technologies", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xcf6B2D875361be807EAfa57458c80f28521F9333", apy: 0, tvl: 3000000 },
  { symbol: "CRWD", name: "CrowdStrike Holdings", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xea72Ecca2d0f6bFA1394DBBCff85b52CD4233931", apy: 0, tvl: 2000000 },
  { symbol: "SNDK", name: "Sandisk Corporation", sector: "Technology", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xB90A19fF0Af67f7779afF50A882A9CfF42446400", apy: 0, tvl: 1000000 },
  { symbol: "NU", name: "Nu Holdings", sector: "Financial", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0x408c14038a04f7bD235329E26d2bf569ee20e250", apy: 0, tvl: 800000 },
  { symbol: "USAR", name: "USA Rare Earth", sector: "Basic Materials", chain: "Robinhood Chain", multiplier: 1.0, backed: true, custodian: "Robinhood Custody", tokenAddress: "0xd917B029C761D264c6A312BBbcDA868658eF86a6", apy: 0, tvl: 600000 },
];

const LOGO_OVERRIDES: Record<string, string> = {
  CRCL: "https://financialmodelingprep.com/image-stock/CRCL.png",
  MRVL: "https://financialmodelingprep.com/image-stock/MRVL.png",
  XNDU: "https://financialmodelingprep.com/image-stock/XNDU.png",
  CRWD: "https://financialmodelingprep.com/image-stock/CRWD.png",
};

export function stockLogoUrl(symbol: string): string {
  const s = symbol.toUpperCase();
  return LOGO_OVERRIDES[s] || `https://assets.parqet.com/logos/symbol/${s}`;
}

export function liveStockLogoUrl(token: Pick<StockToken, "symbol" | "tokenAddress">): string {
  const s = token.symbol.toUpperCase();
  return LOGO_OVERRIDES[s] || `https://cdn.robinhood.com/ncw_assets/logos/${token.tokenAddress.toLowerCase()}.png`;
}

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
