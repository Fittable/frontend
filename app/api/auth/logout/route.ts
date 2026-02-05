import { NextRequest, NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/config";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

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
  return response;
}

