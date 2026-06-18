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
      deposit: Number(formData.get("deposit") ?? 0) || 0,
      moveInDate: dateOrNull(formData.get("moveInDate")) ?? new Date(),
      contractStart: dateOrNull(formData.get("contractStart")),
      contractEnd: dateOrNull(formData.get("contractEnd")),
      active: true,
    },
  });

  revalidatePath("/tenants");
  revalidatePath("/rooms");
  revalidatePath("/");
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
      deposit: Number(formData.get("deposit") ?? 0) || 0,
      moveInDate: dateOrNull(formData.get("moveInDate")) ?? new Date(),
      contractStart: dateOrNull(formData.get("contractStart")),
      contractEnd: dateOrNull(formData.get("contractEnd")),
    },
  });

  revalidatePath("/tenants");
  revalidatePath("/rooms");
}

export async function moveOut(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.tenant.update({ where: { id }, data: { active: false } });
  revalidatePath("/tenants");
  revalidatePath("/rooms");
  revalidatePath("/");
}

export async function deleteTenant(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.tenant.delete({ where: { id } });
  revalidatePath("/tenants");
  revalidatePath("/rooms");
}
