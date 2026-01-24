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

  let url = `${BACKEND_URL}/shifts?month=${month}`;
  if (userId) url += `&user_id=${userId}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Shifts GET proxy error:", error);
    return NextResponse.json({ detail: "Failed to get shifts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/shifts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Shifts POST proxy error:", error);
    return NextResponse.json({ detail: "Failed to create shift" }, { status: 500 });
  }
}

