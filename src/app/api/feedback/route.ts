import { NextRequest, NextResponse } from "next/server";
import { addFeedback, getAllFeedback, getFeedbackStats } from "@/lib/feedback";

export async function GET() {
  try {
    const entries = await getAllFeedback();
    const stats = await getFeedbackStats();
    return NextResponse.json({ entries, stats });
  } catch {
    return NextResponse.json({ entries: [], stats: { total: 0, good: 0, bad: 0, testers: 0, users: 0, uniqueNames: 0, byPage: {} } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, twitter, wallet, role, rating, page, message, browser } = body;

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!rating || !["good", "bad"].includes(rating)) {
      return NextResponse.json({ error: "Rating must be 'good' or 'bad'" }, { status: 400 });
    }

    const entry = await addFeedback({
      name: name.trim(),
      email: (email || "").trim(),
      twitter: (twitter || "").trim(),
      wallet: (wallet || "").trim(),
      role: role === "tester" || role === "user" ? role : "user",
      rating,
      page: (page || "general").trim(),
      message: (message || "").trim(),
      browser: (browser || "").trim(),
    });

    return NextResponse.json({ ok: true, entry });
  } catch {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
