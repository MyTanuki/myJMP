"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function createVehicle(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const plate = String(formData.get("plate") ?? "").trim();
  if (!plate) return;

  await db.vehicle.create({
    data: {
      plate,
      kind: String(formData.get("kind") ?? "car"),
      brand: String(formData.get("brand") ?? "").trim() || null,
      color: String(formData.get("color") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
      roomId: String(formData.get("roomId") ?? "").trim() || null,
      tenantId: String(formData.get("tenantId") ?? "").trim() || null,
    },
  });

  revalidatePath("/vehicles");
}

export async function updateVehicle(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.vehicle.update({
    where: { id },
    data: {
      plate: String(formData.get("plate") ?? "").trim(),
      kind: String(formData.get("kind") ?? "car"),
      brand: String(formData.get("brand") ?? "").trim() || null,
      color: String(formData.get("color") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
      roomId: String(formData.get("roomId") ?? "").trim() || null,
      tenantId: String(formData.get("tenantId") ?? "").trim() || null,
    },
  });

  revalidatePath("/vehicles");
}

export async function deleteVehicle(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.vehicle.delete({ where: { id } });
  revalidatePath("/vehicles");
}
