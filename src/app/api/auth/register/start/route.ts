import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextRequest, NextResponse } from "next/server";
import { getDB, initializeDB } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";

// This should match your deployment domain
const RP_ID = process.env.RP_ID || "localhost";

export async function POST(req: NextRequest) {
  try {
    let { displayName } = await req.json();

    if (!displayName || !displayName.trim()) {
      return NextResponse.json(
        { error: "Username required" },
        { status: 400 }
      );
    }

    // Normalize to lowercase for case-insensitive comparison
    displayName = displayName.trim().toLowerCase();

    await initializeDB();
    const db = await getDB();
    
    // Check if user already registered with this name (case-insensitive)
    const existing = await db.get("SELECT id FROM users WHERE LOWER(displayName) = ?", [displayName]);
    if (existing) {
      return NextResponse.json(
        { error: "This username is already taken" },
        { status: 400 }
      );
    }

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpID: RP_ID,
      rpName: "Cyber Board Reports",
      userID: Buffer.from(uuidv4()),
      userName: displayName,
      userDisplayName: displayName,
    });

    // Store challenge in session for verification
    const cookieStore = await cookies();
    cookieStore.set("reg_challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    return NextResponse.json({
      options,
      displayName,
    });
  } catch (error) {
    console.error("Registration start error:", error);
    return NextResponse.json(
      { error: "Failed to start registration" },
      { status: 500 }
    );
  }
}
