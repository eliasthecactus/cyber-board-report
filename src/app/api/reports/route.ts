import { NextRequest, NextResponse } from "next/server";
import { getAllReports, createReport } from "@/lib/reports";
import { initializeDB } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await initializeDB();
    
    // Filter reports to only those created by the current user
    const reports = await getAllReports(session.userId);
    
    return NextResponse.json(reports);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await initializeDB();
    const { quarter, year } = await request.json();

    if (!quarter || !year) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use authenticated user info - pass userId for database linking
    const report = await createReport(quarter, year, session.displayName, session.userId);
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Report create error:", error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}
