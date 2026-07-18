"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export type AuthState = { error?: string };

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "กรอกอีเมลและรหัสผ่านให้ครบ" };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  await createSession(user.id, user.name);
  redirect("/rooms"); // หน้าแรก = ห้องพัก
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const dormName = String(formData.get("dormName") ?? "").trim() || "หอพักของฉัน";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 6) {
    return { error: "กรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 6 ตัวอักษร" };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "อีเมลนี้ถูกใช้แล้ว" };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { name, dormName, email, passwordHash },
  });

  await createSession(user.id, user.name);
  redirect("/rooms"); // หน้าแรก = ห้องพัก
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
