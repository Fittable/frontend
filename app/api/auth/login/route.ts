import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      // Pass through backend error; client shows detail or message
      const detail = data.detail ?? data.message ?? "Request failed";
      return NextResponse.json(
        { detail: typeof detail === "string" ? detail : JSON.stringify(detail) },
        { status: res.status }
      );
    }

    // LoginResponse: { success, message, token, access_token }
    // Use JWT (access_token) for shifts/users/holidays; session (token) for /api/auth/me if backend still expects it
    const jwt = data.access_token ?? null;
    const sessionToken = data.token ?? null;
    const hasAuth = data.success && (jwt || sessionToken);

    if (hasAuth) {
      const response = NextResponse.json(data);
      const cookieOpts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 60 * 60 * 24, // 24 hours (matching backend)
        path: "/",
      };
      // JWT: used for /api/shifts, /api/users, /api/holidays, etc. If backend only returns session token, use it so auth still works.
      response.cookies.set("access_token", jwt ?? sessionToken!, cookieOpts);
      // Session token: used for /api/auth/me (and logout) if backend still expects it
      if (sessionToken) {
        response.cookies.set("session_token", sessionToken, cookieOpts);
      }
      return response;
    }

    // 200 but success: false (e.g. invalid credentials)
    return NextResponse.json(
      { detail: data.message ?? "Login failed" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login proxy error:", error);
    return NextResponse.json({ detail: "Login failed" }, { status: 500 });
  }
}

