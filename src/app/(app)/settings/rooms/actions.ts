"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAccess } from "@/lib/auth";

type Row = {
  id?: string;
  building: string;
  floor: number;
  number: string;
  name: string | null;
};

function parseRows(raw: FormDataEntryValue | null): Row[] {
  try {
    const arr = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(arr)) return [];
    return arr
      .map((r) => ({
        id: typeof r?.id === "string" ? r.id : undefined,
        building: String(r?.building ?? "").trim() || "A",
        floor: Number(r?.floor) || 1,
        number: String(r?.number ?? "").trim(),
        name: String(r?.name ?? "").trim() || null,
      }))
      .filter((r) => r.number !== "");
  } catch {
    return [];
  }
}

export async function saveRoomGrid(formData: FormData) {
  await requireAccess("/settings");

  const rows = parseRows(formData.get("rows"));

  const existing = await db.room.findMany({
    select: { id: true, _count: { select: { tenants: true } } },
  });
  const existingIds = new Set(existing.map((r) => r.id));
  const keptIds = new Set(rows.map((r) => r.id).filter(Boolean) as string[]);

  // ลบห้องที่ถูกเอาออกจากกริด — เฉพาะห้องที่ไม่มีผู้เช่า (กันข้อมูลผู้เช่าหาย)
  const toDelete = existing.filter(
    (r) => !keptIds.has(r.id) && r._count.tenants === 0
  );
  if (toDelete.length > 0) {
    await db.room.deleteMany({
      where: { id: { in: toDelete.map((r) => r.id) } },
    });
  }

  // อัปเดต/สร้างตามลำดับในกริด
  const seen = new Set<string>(); // กันเลขห้องซ้ำภายในอาคารเดียวกัน
  let order = 0;
  for (const r of rows) {
    const key = `${r.building}::${r.number}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const sortOrder = order++;

    if (r.id && existingIds.has(r.id)) {
      await db.room.update({
        where: { id: r.id },
        data: {
          building: r.building,
          floor: r.floor,
          number: r.number,
          name: r.name,
          sortOrder,
        },
      });
    } else {
      await db.room.create({
        data: {
          building: r.building,
          floor: r.floor,
          number: r.number,
          name: r.name,
          sortOrder,
        },
      });
    }
  }

  // ใช้ type "layout" เพื่อล้าง Client Cache ของทุกหน้าใต้เลย์เอาต์หลัก
  // (เลขห้อง/อาคารกระทบทั้งแดชบอร์ด ภาพรวม และหน้าห้องพัก)
  revalidatePath("/", "layout");
}
