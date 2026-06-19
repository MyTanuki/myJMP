"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function createAsset(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await db.asset.create({
    data: {
      name,
      category: String(formData.get("category") ?? "").trim() || null,
      quantity: Number(formData.get("quantity") ?? 1) || 1,
      condition: String(formData.get("condition") ?? "good"),
      note: String(formData.get("note") ?? "").trim() || null,
      roomId: String(formData.get("roomId") ?? "").trim() || null,
    },
  });

  revalidatePath("/", "layout");
}

export async function updateAsset(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.asset.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim() || null,
      quantity: Number(formData.get("quantity") ?? 1) || 1,
      condition: String(formData.get("condition") ?? "good"),
      note: String(formData.get("note") ?? "").trim() || null,
      roomId: String(formData.get("roomId") ?? "").trim() || null,
    },
  });

  revalidatePath("/", "layout");
}

export async function deleteAsset(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.asset.delete({ where: { id } });
  revalidatePath("/", "layout");
}
