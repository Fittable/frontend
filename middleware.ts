import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token");
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === "/login" || pathname === "/") {
    // If already logged in, redirect to calendar
    if (token) {
      return NextResponse.redirect(new URL("/calendar", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes
  if (pathname.startsWith("/calendar")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/calendar/:path*"],
};

