"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

function str(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

export async function updateSettings(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  await db.user.update({
    where: { id: user.id },
    data: {
      name: String(formData.get("name") ?? user.name).trim() || user.name,
      dormName:
        String(formData.get("dormName") ?? user.dormName).trim() ||
        user.dormName,
      waterRate: Number(formData.get("waterRate") ?? user.waterRate) || 0,
      elecRate: Number(formData.get("elecRate") ?? user.elecRate) || 0,
    },
  });

  revalidatePath("/", "layout");
}

export async function updateBillHeader(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  await db.user.update({
    where: { id: user.id },
    data: {
      businessType: str(formData.get("businessType")),
      taxId: str(formData.get("taxId")),
      address: str(formData.get("address")),
      billNote: str(formData.get("billNote")),
    },
  });

  revalidatePath("/", "layout");
}

export async function updateBank(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  await db.user.update({
    where: { id: user.id },
    data: {
      bankName: str(formData.get("bankName")),
      bankAccountName: str(formData.get("bankAccountName")),
      bankAccountNo: str(formData.get("bankAccountNo")),
    },
  });

  revalidatePath("/", "layout");
}

export async function updatePenalty(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  await db.user.update({
    where: { id: user.id },
    data: { lateFeePerDay: Number(formData.get("lateFeePerDay") ?? 0) || 0 },
  });

  revalidatePath("/", "layout");
}

export async function createPreset(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;

  await db.servicePreset.create({
    data: { label, amount: Number(formData.get("amount") ?? 0) || 0 },
  });

  revalidatePath("/", "layout");
}

export async function deletePreset(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.servicePreset.delete({ where: { id } });
  revalidatePath("/", "layout");
}
