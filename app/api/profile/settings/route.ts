import { NextRequest, NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/config";

function getAuthToken(request: NextRequest): string | null {
  const klasToken = request.cookies.get("session_token")?.value;
  const fallbackToken = request.cookies.get("access_token")?.value;
  return klasToken ?? fallbackToken ?? null;
}

export async function GET(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const url = `${BACKEND_URL}/api/profile/settings`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to get profile settings" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Profile settings GET error:", error);
    return NextResponse.json(
      { detail: "Failed to get profile settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const url = `${BACKEND_URL}/api/profile/settings`;
  try {
    const body = await request.json();
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to update profile settings" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Profile settings PATCH error:", error);
    return NextResponse.json(
      { detail: "Failed to update profile settings" },
      { status: 500 }
    );
  }
}
