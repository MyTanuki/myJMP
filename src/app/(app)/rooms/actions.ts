"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function createRoom(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const number = String(formData.get("number") ?? "").trim();
  if (!number) return;

  await db.room.create({
    data: {
      number,
      floor: Number(formData.get("floor") ?? 1) || 1,
      type: String(formData.get("type") ?? "ห้องพัดลม").trim(),
      ...rentData(formData),
      waterRate: optionalRate(formData.get("waterRate")),
      elecRate: optionalRate(formData.get("elecRate")),
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });

  revalidatePath("/rooms");
  revalidatePath("/");
}

function optionalRate(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function num(v: FormDataEntryValue | null) {
  return Number(v ?? 0) || 0;
}

// ค่าเช่าทุกส่วน (เลขห้อง/ชั้นจัดการที่เมนูจัดการห้องพัก จึงไม่อยู่ที่นี่)
function rentData(formData: FormData) {
  return {
    basePrice: num(formData.get("basePrice")),
    rentFurniture: num(formData.get("rentFurniture")),
    rentCommon: num(formData.get("rentCommon")),
    rentAircon: num(formData.get("rentAircon")),
    rentFridge: num(formData.get("rentFridge")),
    rentTv: num(formData.get("rentTv")),
    rentDiscount: num(formData.get("rentDiscount")),
  };
}

export async function updateRoom(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // เลขห้อง/ชั้น จัดการที่เมนู "จัดการห้องพัก" จึงไม่แก้ที่นี่
  await db.room.update({
    where: { id },
    data: {
      type: String(formData.get("type") ?? "").trim(),
      ...rentData(formData),
      waterRate: optionalRate(formData.get("waterRate")),
      elecRate: optionalRate(formData.get("elecRate")),
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });

  revalidatePath("/rooms");
  revalidatePath("/invoices");
}

export async function deleteRoom(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.room.delete({ where: { id } });
  revalidatePath("/rooms");
  revalidatePath("/");
}

export async function generatePortalLink(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.room.update({
    where: { id },
    data: { publicToken: crypto.randomUUID().replace(/-/g, "") },
  });
  revalidatePath("/rooms");
}
