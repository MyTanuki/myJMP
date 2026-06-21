"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

function dateOrNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s ? new Date(s) : null;
}

export async function createTenant(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
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
      roomId,
      phone: String(formData.get("phone") ?? "").trim() || null,
      idCard: String(formData.get("idCard") ?? "").trim() || null,
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

  await db.tenant.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      roomId: String(formData.get("roomId") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      idCard: String(formData.get("idCard") ?? "").trim() || null,
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
