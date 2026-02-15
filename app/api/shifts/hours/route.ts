import { NextRequest, NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/config";

function getAuthToken(request: NextRequest): string | null {
  const accessToken = request.cookies.get("access_token")?.value;
  const sessionToken = request.cookies.get("session_token")?.value;
  return accessToken ?? sessionToken ?? null;
}

/**
 * Proxy to backend GET /api/shifts/hours.
 * Backend expects: month (YYYY-MM, work month start, e.g. 2026-01 = Jan 25 to Feb 24),
 *                 user_id (optional).
 */
export async function GET(request: NextRequest) {
  const token = getAuthToken(request);

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get("month");
  const userId = searchParams.get("user_id");

  if (!month) {
    return NextResponse.json({ detail: "Month parameter required" }, { status: 400 });
  }

  try {
    let url = `${BACKEND_URL}/api/shifts/hours?month=${encodeURIComponent(month)}`;
    if (userId) url += `&user_id=${encodeURIComponent(userId)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data.detail ?? data.message ?? "Failed to get hours";
      return NextResponse.json({ detail }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Hours GET error:", error);
    return NextResponse.json({ detail: "Failed to get hours" }, { status: 500 });
  }
}
