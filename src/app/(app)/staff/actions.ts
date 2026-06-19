"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export type UserResult = { error?: string };

const ROLES = ["admin", "manager", "staff"];

export async function createUser(formData: FormData): Promise<UserResult> {
  const admin = await currentUser();
  if (!admin || admin.role !== "admin") return { error: "ไม่มีสิทธิ์" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "staff");

  if (!name || !email) return { error: "กรอกชื่อและอีเมลให้ครบ" };
  if (password.length < 6) return { error: "รหัสผ่านอย่างน้อย 6 ตัวอักษร" };
  if (!ROLES.includes(role)) return { error: "เลือกบทบาท" };

  if (await db.user.findUnique({ where: { email } }))
    return { error: "อีเมลนี้ถูกใช้แล้ว" };

  await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      // ให้บัญชีใหม่ใช้ชื่อหอและอัตรากลางเดียวกับผู้ดูแล
      dormName: admin.dormName,
      waterRate: admin.waterRate,
      elecRate: admin.elecRate,
    },
  });

  revalidatePath("/", "layout");
  return {};
}

export async function updateUser(formData: FormData): Promise<UserResult> {
  const admin = await currentUser();
  if (!admin || admin.role !== "admin") return { error: "ไม่มีสิทธิ์" };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ไม่พบบัญชี" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "staff");
  const password = String(formData.get("password") ?? "");

  if (!name || !email) return { error: "กรอกชื่อและอีเมลให้ครบ" };
  if (!ROLES.includes(role)) return { error: "บทบาทไม่ถูกต้อง" };
  if (password && password.length < 6)
    return { error: "รหัสผ่านอย่างน้อย 6 ตัวอักษร" };

  // กันล็อกตัวเองออกจากระบบ
  if (id === admin.id && role !== "admin")
    return { error: "เปลี่ยนบทบาทของบัญชีตัวเองไม่ได้" };

  const dup = await db.user.findUnique({ where: { email } });
  if (dup && dup.id !== id) return { error: "อีเมลนี้ถูกใช้แล้ว" };

  await db.user.update({
    where: { id },
    data: {
      name,
      email,
      role,
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });

  revalidatePath("/", "layout");
  return {};
}

export async function saveBuildingAccess(formData: FormData): Promise<void> {
  const admin = await currentUser();
  if (!admin || admin.role !== "admin") return;

  let matrix: Record<string, string[]>;
  try {
    matrix = JSON.parse(String(formData.get("matrix") ?? "{}"));
  } catch {
    return;
  }

  for (const [userId, buildings] of Object.entries(matrix)) {
    const arr = Array.isArray(buildings) ? buildings.map(String) : [];
    await db.user.update({
      where: { id: userId },
      // ว่าง = ทุกอาคาร จึงเก็บเป็น null
      data: { buildingAccess: arr.length ? JSON.stringify(arr) : null },
    });
  }

  revalidatePath("/", "layout"); // รีเฟรชหน้าที่กรองตามอาคาร
}

export async function deleteUser(formData: FormData): Promise<UserResult> {
  const admin = await currentUser();
  if (!admin || admin.role !== "admin") return { error: "ไม่มีสิทธิ์" };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ไม่พบบัญชี" };
  if (id === admin.id) return { error: "ลบบัญชีของตัวเองไม่ได้" };

  await db.user.delete({ where: { id } });
  revalidatePath("/", "layout");
  return {};
}
