import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { NextRequest, NextResponse } from "next/server";
import { getDB, initializeDB } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { cookies } from "next/headers";

const RP_ID = process.env.RP_ID || "localhost";
const ORIGIN = process.env.ORIGIN || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential, displayName } = body;

    const cookieStore = await cookies();
    const challenge = cookieStore.get("auth_challenge")?.value;
    const storedUsername = cookieStore.get("auth_username")?.value;

    if (!challenge) {
      return NextResponse.json(
        { error: "No authentication challenge found. Start login first." },
        { status: 400 }
      );
    }

    // Validate username matches what was stored (case-insensitive)
    const normalizedDisplayName = displayName?.trim().toLowerCase();
    if (normalizedDisplayName !== storedUsername) {
      return NextResponse.json(
        { error: "Username mismatch" },
        { status: 400 }
      );
    }

    await initializeDB();
    const db = await getDB();

    // Convert base64url credential ID back to Buffer for database lookup
    const base64 = credential.id
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(credential.id.length + (4 - (credential.id.length % 4)) % 4, "=");
    const credentialIdBuffer = Buffer.from(base64, "base64");

    // Find credential by ID
    const credRecord = await db.get(
      `SELECT c.id, c.userId, c.publicKey, c.signCount, u.email, u.displayName 
       FROM credentials c
       JOIN users u ON c.userId = u.id
       WHERE c.credentialId = ?`,
      [credentialIdBuffer]
    );

    if (!credRecord) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 400 }
      );
    }

    // Verify the authentication response
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: credential.id,
          publicKey: Buffer.from(credRecord.publicKey),
          counter: credRecord.signCount,
        } as any,
      });
    } catch (error) {
      console.error("Verification failed:", error);
      return NextResponse.json(
        { error: "Authentication verification failed" },
        { status: 400 }
      );
    }

    if (!verification.verified) {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }

    // Update sign count to prevent cloned credentials
    if (verification.authenticationInfo) {
      await db.run(
        `UPDATE credentials SET signCount = ? WHERE id = ?`,
        [verification.authenticationInfo.newCounter, credRecord.id]
      );
    }

    // Create session
    const { userId, email, displayName: storedDisplayName } = credRecord;
    await createSession(userId, email, storedDisplayName);

    // Clear challenge and username cookies
    cookieStore.delete("auth_challenge");
    cookieStore.delete("auth_username");

    return NextResponse.json({
      success: true,
      user: { id: userId, email, displayName: storedDisplayName },
    });
  } catch (error) {
    console.error("Login finish error:", error);
    return NextResponse.json(
      { error: "Failed to complete authentication" },
      { status: 500 }
    );
  }
}
