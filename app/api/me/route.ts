import { NextRequest, NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/config";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Me proxy error:", error);
    return NextResponse.json({ detail: "Failed to get user" }, { status: 500 });
  }
}

