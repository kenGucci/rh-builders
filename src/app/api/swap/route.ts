import { NextRequest, NextResponse } from "next/server";

const LI_FI_API = "https://li.quest/v1";

interface SwapQuoteParams {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  slippage: string;
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") || "quote";

  try {
    if (action === "quote") {
      const params: SwapQuoteParams = {
        fromChain: request.nextUrl.searchParams.get("fromChain") || "4663",
        toChain: request.nextUrl.searchParams.get("toChain") || "4663",
        fromToken: request.nextUrl.searchParams.get("fromToken") || "ETH",
        toToken: request.nextUrl.searchParams.get("toToken") || "",
        fromAmount: request.nextUrl.searchParams.get("fromAmount") || "",
        fromAddress: request.nextUrl.searchParams.get("fromAddress") || "",
        slippage: request.nextUrl.searchParams.get("slippage") || "0.5",
      };

      if (!params.toToken || !params.fromAmount || !params.fromAddress) {
        return NextResponse.json({ error: "Missing required params: toToken, fromAmount, fromAddress" }, { status: 400 });
      }

      const url = `${LI_FI_API}/quote?fromChain=${params.fromChain}&toChain=${params.toChain}&fromToken=${params.fromToken}&toToken=${params.toToken}&fromAmount=${params.fromAmount}&fromAddress=${params.fromAddress}&slippage=${params.slippage}&allowSwitchChain=false`;
      const res = await fetch(url, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 10 },
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `LI.FI quote failed: ${err}` }, { status: 502 });
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === "tokens") {
      const chainId = request.nextUrl.searchParams.get("chainId") || "4663";
      const res = await fetch(`${LI_FI_API}/tokens?chain=${chainId}`, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 300 },
      });
      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 502 });
      }
      const data = await res.json();
      const tokens = data?.tokens?.[chainId] || [];
      return NextResponse.json({ tokens });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: `Swap API error: ${err instanceof Error ? err.message : "Unknown"}` }, { status: 500 });
  }
}
