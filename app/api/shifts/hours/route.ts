import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get("month");
  const userId = searchParams.get("user_id");

  if (!month) {
    return NextResponse.json({ detail: "Month parameter required" }, { status: 400 });
  }

  let url = `${BACKEND_URL}/shifts/hours?month=${month}`;
  if (userId) url += `&user_id=${userId}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Hours GET proxy error:", error);
    return NextResponse.json({ detail: "Failed to get hours" }, { status: 500 });
  }
}

