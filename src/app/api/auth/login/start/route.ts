import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextRequest, NextResponse } from "next/server";
import { getDB, initializeDB } from "@/lib/db";
import { cookies } from "next/headers";

const RP_ID = process.env.RP_ID || "localhost";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { displayName } = body;

    if (!displayName) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Normalize to lowercase for case-insensitive comparison
    displayName = displayName.trim().toLowerCase();

    await initializeDB();
    const db = await getDB();
    
    // Find user by displayName (case-insensitive)
    const user = await db.get(
      `SELECT id FROM users WHERE LOWER(displayName) = ?`,
      [displayName]
    );

    if (!user) {
      return NextResponse.json(
        { error: "Username not found. Please create an account first." },
        { status: 400 }
      );
    }

    // Get credentials for this user only
    const credentials = await db.all(
      `SELECT c.credentialId FROM credentials c WHERE c.userId = ?`,
      [user.id]
    );

    if (credentials.length === 0) {
      return NextResponse.json(
        { error: "No passkeys registered for this account" },
        { status: 400 }
      );
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: credentials.map((cred: any) => {
        // Convert Buffer to base64url string
        const id = cred.credentialId instanceof Buffer 
          ? cred.credentialId.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
          : cred.credentialId;
        return {
          id,
          transports: ["usb", "ble", "nfc"] as const,
        };
      }),
    });

    // Store challenge and username in cookie (for verification in finish step)
    const cookieStore = await cookies();
    cookieStore.set("auth_challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    cookieStore.set("auth_username", displayName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    return NextResponse.json({ options });
  } catch (error) {
    console.error("Login start error:", error);
    return NextResponse.json(
      { error: "Failed to start authentication" },
      { status: 500 }
    );
  }
}
