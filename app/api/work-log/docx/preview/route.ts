import { NextRequest, NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/config";

/**
 * Proxy GET /api/work-log/docx/preview to the backend.
 * Backend returns the 교비근로 근무학생 근무일지 (student work log) as a .docx file.
 * Query: month (required), format YYYY-MM (work month 25th → 24th, e.g. 2026-01 = 2026-01-25 to 2026-02-24).
 * Response: binary .docx; filename may be in Content-Disposition (e.g. filename*=UTF-8''홍길동_근무일지(1~2월).docx).
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

  const url = `${BACKEND_URL}/api/work-log/docx/preview?month=${encodeURIComponent(month)}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const detail =
        typeof data.detail === "string" ? data.detail : data.message ?? "Failed to fetch work log DOCX";
      return NextResponse.json({ detail }, { status: res.status });
    }

    const blob = await res.blob();
    const contentType =
      res.headers.get("Content-Type") ?? "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const contentDisposition =
      res.headers.get("Content-Disposition") ?? `attachment; filename="근무일지.docx"`;

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error) {
    console.error("Work log DOCX proxy error:", error);
    return NextResponse.json({ detail: "Failed to fetch work log DOCX" }, { status: 500 });
  }
}
