import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, access, mkdir } from "fs/promises";
import { join } from "path";
import { verifyToken } from "@/lib/auth";

const DATA_DIR = join(process.cwd(), "data");
const REPORTS_FILE = join(DATA_DIR, "reports.json");

interface Report {
  id: string;
  reporterId: string;
  targetAddress: string;
  issueType: string;
  message: string;
  createdAt: string;
}

async function ensureDataDir() {
  try {
    await access(DATA_DIR);
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function loadReports(): Promise<Report[]> {
  await ensureDataDir();
  try {
    const raw = await readFile(REPORTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveReports(reports: Report[]) {
  await ensureDataDir();
  await writeFile(REPORTS_FILE, JSON.stringify(reports, null, 2));
}

export async function GET() {
  try {
    const reports = await loadReports();
    return NextResponse.json({ reports });
  } catch (err) {
    console.error("[reports] GET failed:", err);
    return NextResponse.json({ reports: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("thewallrh_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { targetAddress, issueType, message } = body;

    if (!targetAddress || !issueType || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(targetAddress)) {
      return NextResponse.json({ error: "Invalid target address" }, { status: 400 });
    }

    if (typeof message !== "string" || message.length > 2000) {
      return NextResponse.json({ error: "Message must be under 2000 characters" }, { status: 400 });
    }

    const report: Report = {
      id: crypto.randomUUID(),
      reporterId: payload.userId,
      targetAddress: targetAddress.toLowerCase(),
      issueType,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    const reports = await loadReports();
    reports.push(report);
    await saveReports(reports);

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    console.error("[reports] POST failed:", err);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}
