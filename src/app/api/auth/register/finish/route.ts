import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { NextRequest, NextResponse } from "next/server";
import { getDB, initializeDB } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const RP_ID = process.env.RP_ID || "localhost";
const ORIGIN = process.env.ORIGIN || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential, displayName } = body;

    if (!displayName || !displayName.trim()) {
      return NextResponse.json(
        { error: "Display name required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const challenge = cookieStore.get("reg_challenge")?.value;

    if (!challenge) {
      return NextResponse.json(
        { error: "No registration challenge found. Start registration first." },
        { status: 400 }
      );
    }

    // Verify the credential
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });
    } catch (error) {
      console.error("Verification failed:", error);
      return NextResponse.json(
        { error: "Credential verification failed" },
        { status: 400 }
      );
    }

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }

    // Store user and credential
    await initializeDB();
    const db = await getDB();
    const userId = uuidv4();
    const now = new Date().toISOString();
    // Auto-generate email from displayName for database compatibility
    const email = `${displayName.trim().replace(/\s+/g, "_").toLowerCase()}@passkey.local`;

    // Create user
    await db.run(
      `INSERT INTO users (id, email, displayName, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, email, displayName.trim(), now, now]
    );

    // Store credential
    const registrationInfo = verification.registrationInfo;
    if (!registrationInfo || !registrationInfo.credential.publicKey) {
      throw new Error("No registration info in verification response");
    }

    // Convert base64url credential ID to Buffer for storage
    const base64 = credential.id
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(credential.id.length + (4 - (credential.id.length % 4)) % 4, "=");
    const credentialIdBuffer = Buffer.from(base64, "base64");

    await db.run(
      `INSERT INTO credentials (id, userId, credentialId, publicKey, signCount, transports, aaguid, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        userId,
        credentialIdBuffer,
        Buffer.from(registrationInfo.credential.publicKey),
        0,
        JSON.stringify([]),
        registrationInfo.aaguid || "",
        now,
      ]
    );

    // Create session
    await createSession(userId, email, displayName.trim());

    // Clear challenge cookie
    cookieStore.delete("reg_challenge");

    return NextResponse.json({
      success: true,
      user: { id: userId, email, displayName },
    });
  } catch (error) {
    console.error("Registration finish error:", error);
    return NextResponse.json(
      { error: "Failed to complete registration" },
      { status: 500 }
    );
  }
}
