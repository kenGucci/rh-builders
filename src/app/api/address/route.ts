import { NextRequest, NextResponse } from "next/server";
import { v2Fetch } from "@/lib/blockscout";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const data = await v2Fetch(`/addresses/${address.toLowerCase()}`);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/address] Failed:", err);
    return NextResponse.json({ error: "Failed to fetch address" }, { status: 502 });
  }
}
