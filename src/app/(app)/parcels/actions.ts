"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function createParcel(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const recipient = String(formData.get("recipient") ?? "").trim();
  if (!recipient) return;

  await db.parcel.create({
    data: {
      recipient,
      carrier: String(formData.get("carrier") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
      roomId: String(formData.get("roomId") ?? "").trim() || null,
    },
  });

  revalidatePath("/parcels");
}

export async function togglePickup(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const pickedUp = String(formData.get("pickedUp") ?? "") === "true";
  await db.parcel.update({
    where: { id },
    data: {
      pickedUp,
      pickedUpAt: pickedUp ? new Date() : null,
    },
  });
  revalidatePath("/parcels");
}

export async function deleteParcel(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.parcel.delete({ where: { id } });
  revalidatePath("/parcels");
}
