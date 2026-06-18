import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import { canAccess } from "./permissions";

const COOKIE = "dorm_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-me-please-1234567890"
);

export type SessionPayload = { uid: string; name: string };

export async function createSession(uid: string, name: string) {
  const token = await new SignJWT({ uid, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { uid: payload.uid as string, name: payload.name as string };
  } catch {
    return null;
  }
}

export async function currentUser() {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({ where: { id: session.uid } });
}

// บังคับสิทธิ์ตามบทบาทในหน้า server — เด้งกลับหน้าแรกถ้าไม่มีสิทธิ์
export async function requireAccess(path: string) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!canAccess(user.role, path)) redirect("/");
  return user;
}
