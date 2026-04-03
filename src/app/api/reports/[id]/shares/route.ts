import { NextRequest, NextResponse } from "next/server";
import {
  isReportOwner,
  getCollaborators,
  addShare,
  removeShare,
} from "@/lib/reports";
import { initializeDB, getDB } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initializeDB();
    const owner = await isReportOwner(params.id, session.userId);
    if (!owner) {
      return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
    }

    const collaborators = await getCollaborators(params.id);
    return NextResponse.json(collaborators);
  } catch (error) {
    console.error("Get shares error:", error);
    return NextResponse.json({ error: "Failed to get collaborators" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initializeDB();
    const owner = await isReportOwner(params.id, session.userId);
    if (!owner) {
      return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
    }

    const { username } = await request.json();
    if (!username?.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const db = await getDB();
    const targetUser = await db.get(
      `SELECT id, displayName FROM users WHERE LOWER(displayName) = ?`,
      [username.trim().toLowerCase()]
    );

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (targetUser.id === session.userId) {
      return NextResponse.json({ error: "Cannot share with yourself" }, { status: 400 });
    }

    await addShare(params.id, targetUser.id, session.userId);
    return NextResponse.json({ userId: targetUser.id, displayName: targetUser.displayName });
  } catch (error) {
    console.error("Add share error:", error);
    return NextResponse.json({ error: "Failed to share report" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initializeDB();
    const owner = await isReportOwner(params.id, session.userId);
    if (!owner) {
      return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await removeShare(params.id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove share error:", error);
    return NextResponse.json({ error: "Failed to remove collaborator" }, { status: 500 });
  }
}
