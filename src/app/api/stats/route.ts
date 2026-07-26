import { NextRequest, NextResponse } from "next/server";

const V1 = "https://robinhoodchain.blockscout.com/api";
const V2 = "https://robinhoodchain.blockscout.com/api/v2";

async function apiFetch(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const [addrV2, txV1, tokenV1] = await Promise.allSettled([
      apiFetch(`${V2}/addresses/${address.toLowerCase()}`),
      apiFetch(`${V1}?module=account&action=txlist&address=${address}&page=1&offset=1000&sort=desc`),
      apiFetch(`${V1}?module=account&action=tokentx&address=${address}&page=1&offset=1000&sort=desc`),
    ]);

    const addrData = addrV2.status === "fulfilled" ? addrV2.value : {};
    const rawTxs = txV1.status === "fulfilled" && Array.isArray(txV1.value?.result) ? txV1.value.result : [];
    const rawTokens = tokenV1.status === "fulfilled" && Array.isArray(tokenV1.value?.result) ? tokenV1.value.result : [];

    let contractsDeployed = 0;
    for (const tx of rawTxs) {
      if (
        (!tx.to || tx.to === "" || tx.to === "0x0000000000000000000000000000000000000000") &&
        tx.input && tx.input !== "0x"
      ) {
        contractsDeployed++;
      }
    }

    const balance = addrData.coin_balance || "0";
    const exchangeRate = parseFloat(addrData.exchange_rate || "0");

    return NextResponse.json({
      totalTransactions: rawTxs.length,
      contractsDeployed,
      tokenTransfers: rawTokens.length,
      coinBalance: balance,
      coinBalanceUsd: exchangeRate > 0 ? (Number(balance) / 1e18 * exchangeRate).toFixed(2) : "0",
      ethPrice: exchangeRate,
      isVerified: addrData.is_verified || false,
      isScam: addrData.is_scam || false,
      ensDomain: addrData.ens_domain_name || null,
      name: addrData.name || null,
      reputation: addrData.reputation || "unknown",
      hasLogs: addrData.has_logs || false,
      hasTokens: addrData.has_tokens || false,
    });
  } catch {
    return NextResponse.json({
      totalTransactions: 0, contractsDeployed: 0, tokenTransfers: 0,
      coinBalance: "0", coinBalanceUsd: "0", ethPrice: 0,
      isVerified: false, isScam: false, ensDomain: null, name: null,
      reputation: "unknown", hasLogs: false, hasTokens: false,
    });
  }
}
