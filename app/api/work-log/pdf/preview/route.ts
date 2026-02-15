import { NextRequest, NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/config";

/**
 * Proxy GET /api/work-log/pdf/preview to the backend.
 * Backend builds PDF from the current user's shifts for the work month (25th → 24th).
 * Query: month (required), format YYYY-MM (e.g. 2026-01).
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get("month");

  if (!month) {
    return NextResponse.json({ detail: "month is required" }, { status: 400 });
  }

  const url = `${BACKEND_URL}/api/work-log/pdf/preview?month=${encodeURIComponent(month)}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const detail =
        typeof data.detail === "string" ? data.detail : data.message ?? "Failed to fetch PDF";
      return NextResponse.json({ detail }, { status: res.status });
    }

    const blob = await res.blob();
    const contentType = res.headers.get("Content-Type") ?? "application/pdf";
    // Forward backend's Content-Disposition unchanged (may include RFC 5987 filename*=UTF-8''... for Korean filenames)
    const contentDisposition =
      res.headers.get("Content-Disposition") ?? `inline; filename="work_log_${month}.pdf"`;

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error) {
    console.error("Work log PDF proxy error:", error);
    return NextResponse.json({ detail: "Failed to fetch work log PDF" }, { status: 500 });
  }
}
