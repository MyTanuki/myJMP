"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

type Row = {
  roomId: string;
  water: number;
  elec: number;
  waterMeterChanged: boolean;
  waterOldEnd: number;
  elecMeterChanged: boolean;
  elecOldEnd: number;
};

function parseRows(raw: FormDataEntryValue | null): Row[] {
  try {
    const arr = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(arr)) return [];
    return arr
      .map((r) => ({
        roomId: String(r?.roomId ?? ""),
        water: Number(r?.water) || 0,
        elec: Number(r?.elec) || 0,
        waterMeterChanged: Boolean(r?.waterMeterChanged),
        waterOldEnd: Number(r?.waterOldEnd) || 0,
        elecMeterChanged: Boolean(r?.elecMeterChanged),
        elecOldEnd: Number(r?.elecOldEnd) || 0,
      }))
      .filter((r) => r.roomId !== "");
  } catch {
    return [];
  }
}

export async function saveMeters(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const period = String(formData.get("period") ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(period)) return;

  const rows = parseRows(formData.get("rows"));

  for (const row of rows) {
    const meterFields = {
      water: row.water,
      elec: row.elec,
      waterMeterChanged: row.waterMeterChanged,
      waterOldEnd: row.waterOldEnd,
      elecMeterChanged: row.elecMeterChanged,
      elecOldEnd: row.elecOldEnd,
    };

    await db.meterReading.upsert({
      where: { roomId_period: { roomId: row.roomId, period } },
      update: meterFields,
      create: {
        roomId: row.roomId,
        period,
        ...meterFields,
      },
    });

    // สะท้อนไปยังบิลของรอบนี้ทันที (ถ้ามีบิลแล้ว) รวมสถานะเปลี่ยนมิเตอร์
    await db.invoice.updateMany({
      where: { roomId: row.roomId, period },
      data: {
        currWater: row.water,
        currElec: row.elec,
        waterMeterChanged: row.waterMeterChanged,
        waterOldEnd: row.waterOldEnd,
        elecMeterChanged: row.elecMeterChanged,
        elecOldEnd: row.elecOldEnd,
      },
    });
  }

  revalidatePath("/", "layout");
}
