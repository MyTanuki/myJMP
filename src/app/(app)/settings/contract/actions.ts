"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function createTemplate(formData: FormData) {
  const user = await currentUser();
  if (!user || user.role !== "admin") return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const body = String(formData.get("body") ?? "");
  const isDefault = String(formData.get("isDefault") ?? "") === "true";

  if (isDefault) {
    await db.contractTemplate.updateMany({ data: { isDefault: false } });
  }
  await db.contractTemplate.create({ data: { name, body, isDefault } });
  revalidatePath("/", "layout");
}

export async function updateTemplate(formData: FormData) {
  const user = await currentUser();
  if (!user || user.role !== "admin") return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const body = String(formData.get("body") ?? "");
  const isDefault = String(formData.get("isDefault") ?? "") === "true";

  if (isDefault) {
    await db.contractTemplate.updateMany({
      where: { NOT: { id } },
      data: { isDefault: false },
    });
  }
  await db.contractTemplate.update({
    where: { id },
    data: { name, body, isDefault },
  });
  revalidatePath("/", "layout");
}

export async function deleteTemplate(formData: FormData) {
  const user = await currentUser();
  if (!user || user.role !== "admin") return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.contractTemplate.delete({ where: { id } });
  revalidatePath("/", "layout");
}
