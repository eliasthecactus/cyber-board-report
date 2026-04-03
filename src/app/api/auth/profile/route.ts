import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/auth";
import { getDB, initializeDB } from "@/lib/db";
import { updateCreatedByForUser } from "@/lib/reports";

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { displayName } = await req.json();

    if (!displayName || !displayName.trim()) {
      return NextResponse.json(
        { error: "Username cannot be empty" },
        { status: 400 }
      );
    }

    if (displayName.trim().length > 50) {
      return NextResponse.json(
        { error: "Username must be 50 characters or less" },
        { status: 400 }
      );
    }

    const normalizedName = displayName.trim().toLowerCase();

    // Check if new username is same as current (case-insensitive)
    if (normalizedName === session.displayName.toLowerCase()) {
      return NextResponse.json(
        { error: "New username is the same as current username" },
        { status: 400 }
      );
    }

    await initializeDB();
    const db = await getDB();

    // Check if another user already has this username (case-insensitive)
    const existing = await db.get(
      `SELECT id FROM users WHERE LOWER(displayName) = ? AND id != ?`,
      [normalizedName, session.userId]
    );

    if (existing) {
      return NextResponse.json(
        { error: "This username is already taken" },
        { status: 400 }
      );
    }

    // Update user's displayName
    await db.run(
      `UPDATE users SET displayName = ?, updatedAt = ? WHERE id = ?`,
      [normalizedName, new Date().toISOString(), session.userId]
    );

    // Update createdBy on all reports owned by this user
    await updateCreatedByForUser(session.userId, normalizedName);

    // Re-issue JWT so /api/auth/me returns the updated name immediately
    await createSession(session.userId, session.email, normalizedName);

    return NextResponse.json({
      id: session.userId,
      email: session.email,
      displayName: normalizedName,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await initializeDB();
    const db = await getDB();

    // Use a transaction for atomic cascade delete
    await db.run("BEGIN TRANSACTION");
    try {
      await db.run(`DELETE FROM reports WHERE userId = ?`, [session.userId]);
      await db.run(`DELETE FROM credentials WHERE userId = ?`, [session.userId]);
      await db.run(`DELETE FROM sessions WHERE userId = ?`, [session.userId]);
      await db.run(`DELETE FROM users WHERE id = ?`, [session.userId]);
      await db.run("COMMIT");
    } catch (txError) {
      await db.run("ROLLBACK");
      throw txError;
    }

    // Clear session cookie
    const response = NextResponse.json({
      success: true,
      message: "Profile deleted successfully",
    });

    response.cookies.delete("session");

    return response;
  } catch (error) {
    console.error("Profile delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 }
    );
  }
}
