import { NextRequest, NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/config";

export async function GET(request: NextRequest) {
  // Timetable endpoint requires KLAS session token (used to fetch from KLAS)
  const klasToken = request.cookies.get("session_token")?.value;
  const fallbackToken = request.cookies.get("access_token")?.value;
  const token = klasToken ?? fallbackToken;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const semester = searchParams.get("semester");

  if (!year || !semester) {
    return NextResponse.json(
      { detail: "year and semester are required" },
      { status: 400 }
    );
  }

  const url = `${BACKEND_URL}/api/timetable?year=${year}&semester=${semester}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail =
        typeof data.detail === "string"
          ? data.detail
          : data.message ?? "Request failed";
      return NextResponse.json({ detail }, { status: res.status });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Timetable GET proxy error:", error);
    return NextResponse.json(
      { detail: "Failed to get timetable" },
      { status: 500 }
    );
  }
}
