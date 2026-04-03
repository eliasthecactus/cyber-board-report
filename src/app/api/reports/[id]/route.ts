import { NextRequest, NextResponse } from "next/server";
import { getReport, updateReport, deleteReport, isReportOwner, getCollaborators } from "@/lib/reports";
import { initializeDB } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    // Get report only if user owns it or is a collaborator
    const report = await getReport(params.id, session.userId);
    if (!report) {
      return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
    }
    const owner = await isReportOwner(params.id, session.userId);
    const collaborators = owner ? await getCollaborators(params.id) : [];
    return NextResponse.json({ report, isOwner: owner, collaborators });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    // Verify ownership before updating
    const existing = await getReport(params.id, session.userId);
    if (!existing) {
      return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
    }
    const report = await request.json();
    await updateReport(params.id, report, session.userId);
    return NextResponse.json(report);
  } catch (error) {
    console.error("Report update error:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    // Only the owner can delete the report
    const owned = await isReportOwner(params.id, session.userId);
    if (!owned) {
      return NextResponse.json(
        { error: "Not found or access denied" },
        { status: 404 }
      );
    }

    await deleteReport(params.id, session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Report delete error:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
