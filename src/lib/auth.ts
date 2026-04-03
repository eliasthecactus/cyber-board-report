import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { getDB } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production"
);

export interface SessionPayload {
  userId: string;
  email: string;
  displayName: string;
  iat: number;
  exp: number;
}

export async function createSession(userId: string, email: string, displayName: string): Promise<string> {
  const token = await new SignJWT({ userId, email, displayName })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = cookies();
  (await cookieStore).set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("session")?.value;

    if (!token) return null;

    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as SessionPayload;
  } catch (err) {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = cookies();
  (await cookieStore).delete("session");
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getUserById(userId: string) {
  const db = await getDB();
  return db.get(
    "SELECT id, email, displayName, createdAt, updatedAt FROM users WHERE id = ?",
    [userId]
  );
}
