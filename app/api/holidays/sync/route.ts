import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");

  if (!year) {
    return NextResponse.json({ detail: "Year parameter required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/holidays/sync?year=${year}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Holidays sync proxy error:", error);
    return NextResponse.json({ detail: "Failed to sync holidays" }, { status: 500 });
  }
}

