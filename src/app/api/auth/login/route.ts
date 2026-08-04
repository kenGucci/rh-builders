import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Email login is disabled. Use X to sign in." },
    { status: 403 }
  );
}
