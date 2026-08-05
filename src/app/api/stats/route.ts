import { NextRequest, NextResponse } from "next/server";
import { v2Fetch, v1Fetch } from "@/lib/blockscout";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const [addrV2, txV1, tokenV1] = await Promise.allSettled([
      v2Fetch(`/addresses/${address.toLowerCase()}`),
      v1Fetch("account", "txlist", { address, page: "1", offset: "1000", sort: "desc" }),
      v1Fetch("account", "tokentx", { address, page: "1", offset: "1000", sort: "desc" }),
    ]);

    const addrData = addrV2.status === "fulfilled" ? (addrV2.value as Record<string, unknown> | null) : null;
    const txRaw = txV1.status === "fulfilled" ? (txV1.value as Record<string, unknown> | null) : null;
    const tokenRaw = tokenV1.status === "fulfilled" ? (tokenV1.value as Record<string, unknown> | null) : null;
    const rawTxs = Array.isArray(txRaw?.result) ? txRaw.result : [];
    const rawTokens = Array.isArray(tokenRaw?.result) ? tokenRaw.result : [];

    let contractsDeployed = 0;
    for (const tx of rawTxs) {
      if (
        (!tx.to || tx.to === "" || tx.to === "0x0000000000000000000000000000000000000000") &&
        tx.input && tx.input !== "0x"
      ) {
        contractsDeployed++;
      }
    }

    const balance = String(addrData?.coin_balance || "0");
    const exchangeRate = Number(addrData?.exchange_rate || "0");

    return NextResponse.json({
      totalTransactions: rawTxs.length,
      contractsDeployed,
      tokenTransfers: rawTokens.length,
      coinBalance: balance,
      coinBalanceUsd: exchangeRate > 0 ? (Number(balance) / 1e18 * exchangeRate).toFixed(2) : "0",
      ethPrice: exchangeRate,
      isVerified: addrData?.is_verified || false,
      isScam: addrData?.is_scam || false,
      ensDomain: addrData?.ens_domain_name || null,
      name: addrData?.name || null,
      reputation: addrData?.reputation || "unknown",
      hasLogs: addrData?.has_logs || false,
      hasTokens: addrData?.has_tokens || false,
    });
  } catch (err) {
    console.error("[stats] Failed:", err);
    return NextResponse.json({
      totalTransactions: 0, contractsDeployed: 0, tokenTransfers: 0,
      coinBalance: "0", coinBalanceUsd: "0", ethPrice: 0,
      isVerified: false, isScam: false, ensDomain: null, name: null,
      reputation: "unknown", hasLogs: false, hasTokens: false,
    });
  }
}
