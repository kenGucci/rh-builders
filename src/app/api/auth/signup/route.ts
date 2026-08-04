import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Email signup is disabled. Use X to sign in." },
    { status: 403 }
  );
}
