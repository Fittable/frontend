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

    // LoginResponse: { success, message, token }
    if (data.success && data.token) {
      const response = NextResponse.json(data);
      response.cookies.set("access_token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours (matching backend)
        path: "/",
      });
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

