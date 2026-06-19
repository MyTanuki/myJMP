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
  const roomId = String(formData.get("roomId") ?? "");
  if (!name || !roomId) return;

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
      roomId: String(formData.get("roomId") ?? ""),
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
