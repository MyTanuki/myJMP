"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

function dateOrNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s ? new Date(s) : null;
}

function str(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

// ประกอบชื่อเต็มจาก คำนำหน้า + ชื่อ + นามสกุล (ไม่เว้นวรรคหลังคำนำหน้าตามแบบไทย)
function composeName(formData: FormData) {
  const prefix = String(formData.get("prefix") ?? "").trim();
  const first = String(formData.get("firstName") ?? "").trim();
  const last = String(formData.get("lastName") ?? "").trim();
  return `${prefix}${first}${first && last ? " " : ""}${last}`.trim();
}

// บันทึกรูปบัตรประชาชน → คืน URL สำหรับ <img src>
// Production (Vercel) → Vercel Blob (ระบบไฟล์ serverless เขียนไม่ได้)
// Local dev → เขียนลง public/uploads/idcards
async function saveIdCard(formData: FormData) {
  const file = formData.get("idCardImage");
  if (!(file instanceof File) || file.size === 0) return undefined;
  const ext = (file.name.split(".").pop() ?? "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") || "jpg";
  const filename = `${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`idcards/${filename}`, file, { access: "public" });
    return blob.url;
  }

  // อยู่บน Vercel แต่ยังไม่ได้ตั้งค่า Blob → เขียนไฟล์ไม่ได้ (fs read-only)
  if (process.env.VERCEL) {
    throw new Error(
      "อัปโหลดรูปบัตรไม่ได้: ยังไม่ได้เชื่อม Vercel Blob — สร้าง Blob store เชื่อมกับโปรเจกต์ myjmp1 แล้ว Redeploy"
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", "idcards");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/idcards/${filename}`;
}

export async function createTenant(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const name = composeName(formData);
  const roomId = String(formData.get("roomId") ?? "").trim() || null;
  if (!name) return;

  // ห้องหนึ่งมีผู้เช่าที่ใช้งานได้คนเดียว — ย้ายคนเดิมออกก่อน (เฉพาะเมื่อกำหนดห้อง)
  if (roomId) {
    await db.tenant.updateMany({
      where: { roomId, active: true },
      data: { active: false },
    });
  }

  await db.tenant.create({
    data: {
      name,
      prefix: str(formData.get("prefix")),
      firstName: str(formData.get("firstName")),
      lastName: str(formData.get("lastName")),
      nickname: str(formData.get("nickname")),
      roomId,
      phone: String(formData.get("phone") ?? "").trim() || null,
      idCard: String(formData.get("idCard") ?? "").trim() || null,
      idCardImage: (await saveIdCard(formData)) ?? null,
      vehiclePlate: String(formData.get("vehiclePlate") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      subdistrict: String(formData.get("subdistrict") ?? "").trim() || null,
      district: String(formData.get("district") ?? "").trim() || null,
      province: String(formData.get("province") ?? "").trim() || null,
      postalCode: String(formData.get("postalCode") ?? "").trim() || null,
      deposit: Number(formData.get("deposit") ?? 0) || 0,
      moveInDate: dateOrNull(formData.get("moveInDate")) ?? new Date(),
      contractStart: dateOrNull(formData.get("contractStart")),
      contractEnd: dateOrNull(formData.get("contractEnd")),
      active: true,
    },
  });

  revalidatePath("/", "layout");
}

export async function updateTenant(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const newIdCardImage = await saveIdCard(formData);

  await db.tenant.update({
    where: { id },
    data: {
      // เก็บชื่อเดิมไว้ถ้าประกอบใหม่ได้ค่าว่าง (กันข้อมูลหาย)
      name: composeName(formData) || undefined,
      prefix: str(formData.get("prefix")),
      firstName: str(formData.get("firstName")),
      lastName: str(formData.get("lastName")),
      nickname: str(formData.get("nickname")),
      roomId: String(formData.get("roomId") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      idCard: String(formData.get("idCard") ?? "").trim() || null,
      // อัปเดตรูปเฉพาะเมื่อมีการอัปโหลดใหม่
      ...(newIdCardImage ? { idCardImage: newIdCardImage } : {}),
      vehiclePlate: String(formData.get("vehiclePlate") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      subdistrict: String(formData.get("subdistrict") ?? "").trim() || null,
      district: String(formData.get("district") ?? "").trim() || null,
      province: String(formData.get("province") ?? "").trim() || null,
      postalCode: String(formData.get("postalCode") ?? "").trim() || null,
    },
  });

  revalidatePath("/", "layout");
}

export async function moveOut(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.tenant.update({ where: { id }, data: { active: false } });
  revalidatePath("/", "layout");
}

// ย้ายผู้เช่าที่มีอยู่แล้วเข้าห้อง (ใช้จากหน้า /rooms/[id] → /tenants?assign=roomId)
export async function assignTenantToRoom(tenantId: string, roomId: string) {
  if (!tenantId || !roomId) return;
  // 1 ห้องมีผู้เช่าที่ใช้งานได้คนเดียว — ย้ายคนเดิมของห้องนี้ออกก่อน
  await db.tenant.updateMany({
    where: { roomId, active: true, NOT: { id: tenantId } },
    data: { active: false },
  });
  await db.tenant.update({
    where: { id: tenantId },
    data: { roomId, active: true },
  });
  revalidatePath("/", "layout");
}

export async function deleteTenant(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.tenant.delete({ where: { id } });
  revalidatePath("/", "layout");
}
