"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

function dateOrNow(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s ? new Date(s) : new Date();
}

export async function createBooking(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await db.booking.create({
    data: {
      name,
      phone: String(formData.get("phone") ?? "").trim() || null,
      date: dateOrNow(formData.get("date")),
      status: String(formData.get("status") ?? "pending"),
      deposit: Number(formData.get("deposit") ?? 0) || 0,
      note: String(formData.get("note") ?? "").trim() || null,
      roomId: String(formData.get("roomId") ?? "").trim() || null,
    },
  });

  revalidatePath("/", "layout");
}

export async function updateBooking(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.booking.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || null,
      date: dateOrNow(formData.get("date")),
      status: String(formData.get("status") ?? "pending"),
      deposit: Number(formData.get("deposit") ?? 0) || 0,
      note: String(formData.get("note") ?? "").trim() || null,
      roomId: String(formData.get("roomId") ?? "").trim() || null,
    },
  });

  revalidatePath("/", "layout");
}

export async function deleteBooking(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.booking.delete({ where: { id } });
  revalidatePath("/", "layout");
}
