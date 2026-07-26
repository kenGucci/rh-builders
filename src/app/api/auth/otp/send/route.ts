import { NextRequest, NextResponse } from "next/server";
import { generateOTP } from "@/lib/otp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalised = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const result = generateOTP(normalised);

    if (typeof result === "object" && "error" in result) {
      return NextResponse.json({ error: result.error }, { status: 429 });
    }

    const code = result;

    return NextResponse.json({
      ok: true,
      message: "Verification code sent",
      email: normalised,
    });
  } catch {
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
