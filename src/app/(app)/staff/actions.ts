"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function createStaff(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await db.staff.create({
    data: {
      name,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      role: String(formData.get("role") ?? "staff"),
      active: true,
    },
  });

  revalidatePath("/staff");
}

export async function updateStaff(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.staff.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      role: String(formData.get("role") ?? "staff"),
      active: String(formData.get("active") ?? "true") === "true",
    },
  });

  revalidatePath("/staff");
}

export async function deleteStaff(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.staff.delete({ where: { id } });
  revalidatePath("/staff");
}
