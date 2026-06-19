"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

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

  // "layout" จำเป็นเพื่อล้าง client Router Cache ไม่งั้นเปิดแก้ไขซ้ำจะเห็นค่าเดิม
  revalidatePath("/", "layout");
}

export async function generatePortalLink(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.room.update({
    where: { id },
    data: { publicToken: crypto.randomUUID().replace(/-/g, "") },
  });
  revalidatePath("/", "layout");
}
