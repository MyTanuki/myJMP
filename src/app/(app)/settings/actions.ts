"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

function str(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

// วันที่ 1-31 หรือ null (ไม่กำหนด)
function dayOfMonth(v: FormDataEntryValue | null): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
}

export async function updateInfo(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  await db.user.update({
    where: { id: user.id },
    data: {
      name: String(formData.get("name") ?? user.name).trim() || user.name,
      dormName:
        String(formData.get("dormName") ?? user.dormName).trim() ||
        user.dormName,
      phone: str(formData.get("phone")),
      address: str(formData.get("address")),
      billDay: dayOfMonth(formData.get("billDay")),
      dueDay: dayOfMonth(formData.get("dueDay")),
    },
  });

  revalidatePath("/", "layout");
}

export async function updateRates(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  await db.user.update({
    where: { id: user.id },
    data: {
      waterRate: Number(formData.get("waterRate") ?? user.waterRate) || 0,
      elecRate: Number(formData.get("elecRate") ?? user.elecRate) || 0,
    },
  });

  revalidatePath("/", "layout");
}

// อัตราค่าน้ำ-ไฟรายห้อง: null = ใช้ค่ากลาง
export async function saveRoomRates(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  let rows: { roomId: string; waterRate: number | null; elecRate: number | null }[];
  try {
    const arr = JSON.parse(String(formData.get("rows") ?? "[]"));
    if (!Array.isArray(arr)) return;
    rows = arr
      .map((r) => ({
        roomId: String(r?.roomId ?? ""),
        waterRate:
          r?.waterRate === null || r?.waterRate === ""
            ? null
            : Number(r?.waterRate) || 0,
        elecRate:
          r?.elecRate === null || r?.elecRate === ""
            ? null
            : Number(r?.elecRate) || 0,
      }))
      .filter((r) => r.roomId !== "");
  } catch {
    return;
  }

  for (const row of rows) {
    await db.room.update({
      where: { id: row.roomId },
      data: { waterRate: row.waterRate, elecRate: row.elecRate },
    });
  }

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
