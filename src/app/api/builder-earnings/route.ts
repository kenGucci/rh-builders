import { NextRequest, NextResponse } from "next/server";
import { getDevEarnings } from "@/lib/dev-earnings";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAddressValid(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !isAddressValid(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const earnings = await getDevEarnings(address);
    return NextResponse.json(earnings);
  } catch (err) {
    console.error("[builder-earnings] Failed:", err);
    return NextResponse.json(
      { error: "Failed to compute earnings. Try again shortly." },
      { status: 502 }
    );
  }
}
