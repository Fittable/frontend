import { NextRequest, NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/config";

export async function GET(request: NextRequest) {
  const klasToken = request.cookies.get("session_token")?.value;
  const fallbackToken = request.cookies.get("access_token")?.value;
  const token = klasToken ?? fallbackToken;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const url = `${BACKEND_URL}/api/profile/image`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json(
        { detail: "Failed to get profile image" },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const blob = await res.blob();

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("Profile image proxy error:", error);
    return NextResponse.json(
      { detail: "Failed to get profile image" },
      { status: 500 }
    );
  }
}
