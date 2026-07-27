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

    console.log(`[OTP] Verification code for ${normalised}: ${code}`);

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.OTP_FROM_EMAIL || "GAMBO RH <noreply@gambo.ai>",
            to: normalised,
            subject: "Your GAMBO RH Verification Code",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="font-size: 20px; font-weight: 600; margin: 0;">GAMBO RH</h1>
                  <p style="color: #888; font-size: 12px; margin-top: 4px;">Robinhood Chain Explorer</p>
                </div>
                <p style="color: #ccc; font-size: 14px; text-align: center;">Your verification code is:</p>
                <div style="text-align: center; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #00c805; font-family: monospace;">${code}</span>
                </div>
                <p style="color: #666; font-size: 11px; text-align: center;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
              </div>
            `,
          }),
        });
        console.log(`[OTP] Email sent to ${normalised}`);
      } catch (err) {
        console.error(`[OTP] Failed to send email to ${normalised}:`, err);
      }
    } else {
      console.log(`[OTP] No RESEND_API_KEY configured — code logged above for development`);
    }

    return NextResponse.json({
      ok: true,
      message: "Verification code sent",
      email: normalised,
    });
  } catch {
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
