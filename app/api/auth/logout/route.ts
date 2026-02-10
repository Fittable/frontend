import { NextRequest, NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/config";

export async function POST(request: NextRequest) {
  // Prefer session token for logout if backend expects it; otherwise use JWT
  const sessionToken = request.cookies.get("session_token")?.value;
  const accessToken = request.cookies.get("access_token")?.value;
  const token = sessionToken ?? accessToken;

  if (token) {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Logout proxy error:", error);
    }
  }

  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.delete("access_token");
  response.cookies.delete("session_token");
  return response;
}

