import { NextRequest, NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/config";

/**
 * Proxy to backend GET /api/shifts/schedule/pdf.
 * Backend expects: month (YYYY-MM, work month start, e.g. 2026-01 = Jan 25 to Feb 24),
 *                  or start_date + end_date (YYYY-MM-DD).
 * Returns PDF blob.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get("month");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  try {
    let url = `${BACKEND_URL}/api/shifts/schedule/pdf?`;
    const params = new URLSearchParams();
    
    if (startDate && endDate) {
      params.append("start_date", startDate);
      params.append("end_date", endDate);
    } else if (month) {
      params.append("month", month);
    } else {
      return NextResponse.json(
        { detail: "Either month or start_date+end_date required" },
        { status: 400 }
      );
    }
    
    url += params.toString();

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Failed to download PDF" }));
      const detail = error.detail ?? error.message ?? "Failed to download PDF";
      return NextResponse.json({ detail }, { status: res.status });
    }

    // Get the PDF blob
    const blob = await res.blob();
    
    // Get filename from Content-Disposition header if available
    const contentDisposition = res.headers.get("Content-Disposition");
    let filename = "schedule.pdf";
    if (contentDisposition) {
      // Try to parse filename from Content-Disposition header
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    // Return PDF blob with appropriate headers
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF download error:", error);
    return NextResponse.json({ detail: "Failed to download PDF" }, { status: 500 });
  }
}
