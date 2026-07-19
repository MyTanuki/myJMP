"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { allowedBuildings } from "@/lib/permissions";
import { monthlyRent } from "@/lib/format";

// ออกบิลอัตโนมัติทั้งเดือน: ห้องที่มีผู้เช่าและยังไม่มีบิลรอบนี้
// ดึงค่าเช่าจากห้อง เลขมิเตอร์จากที่จด และรายการบริการจากบิลเดือนก่อนมาตั้งต้น
export async function createMonthlyInvoices(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const period = String(formData.get("period") ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(period)) return;

  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 2, 1); // เดือนก่อนหน้า
  const prevPeriod = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const allowed = allowedBuildings(user.role, user.buildingAccess);
  const rooms = await db.room.findMany({
    where: allowed ? { building: { in: allowed } } : {},
    include: {
      tenants: { where: { active: true }, take: 1 },
      invoices: { include: { items: true } },
      meterReadings: { where: { period: { in: [period, prevPeriod] } } },
    },
  });

  const dueDate = user.dueDay
    ? new Date(y, m - 1, Math.min(user.dueDay, new Date(y, m, 0).getDate()))
    : null;

  let created = 0;
  for (const room of rooms) {
    const tenant = room.tenants[0];
    if (!tenant) continue; // ห้องว่าง ไม่ออกบิล
    if (room.invoices.some((i) => i.period === period)) continue; // มีบิลแล้ว

    const cur = room.meterReadings.find((r) => r.period === period);
    const prev = room.meterReadings.find((r) => r.period === prevPeriod);
    const earlier = room.invoices
      .filter((i) => i.period < period)
      .sort((a, b) => (a.period < b.period ? 1 : -1))[0];

    // เข้าพักในเดือนนี้ → ตัวตั้ง = เลขมิเตอร์ตอนเข้าพัก (แบบต้นแบบ)
    const startDate = tenant.contractStart ?? tenant.moveInDate ?? null;
    const movedInThisPeriod =
      !!startDate &&
      `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}` ===
        period;

    const prevWater =
      movedInThisPeriod && tenant.moveInWater != null
        ? tenant.moveInWater
        : (prev?.water ?? earlier?.currWater ?? 0);
    const prevElec =
      movedInThisPeriod && tenant.moveInElec != null
        ? tenant.moveInElec
        : (prev?.elec ?? earlier?.currElec ?? 0);

    const invoice = await db.invoice.create({
      data: {
        roomId: room.id,
        period,
        tenantId: tenant.id,
        rent: monthlyRent(room),
        prevWater,
        currWater: cur?.water ?? prevWater,
        prevElec,
        currElec: cur?.elec ?? prevElec,
        waterMeterChanged: cur?.waterMeterChanged ?? false,
        waterOldEnd: cur?.waterOldEnd ?? 0,
        elecMeterChanged: cur?.elecMeterChanged ?? false,
        elecOldEnd: cur?.elecOldEnd ?? 0,
        waterRate: room.waterRate ?? user.waterRate,
        elecRate: room.elecRate ?? user.elecRate,
        dueDate,
      },
    });

    // คัดลอกรายการบริการจากบิลล่าสุดของห้อง (รายการประจำ เช่น ค่าที่จอดรถ)
    if (earlier && earlier.items.length > 0) {
      await db.invoiceItem.createMany({
        data: earlier.items.map((it) => ({
          invoiceId: invoice.id,
          label: it.label,
          amount: it.amount,
        })),
      });
    }
    created++;
  }

  revalidatePath("/", "layout");
  return { created };
}

export async function createInvoice(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const roomId = String(formData.get("roomId") ?? "");
  const period = String(formData.get("period") ?? "").trim();
  if (!roomId || !/^\d{4}-\d{2}$/.test(period)) return;

  const room = await db.room.findUnique({
    where: { id: roomId },
    include: { tenants: { where: { active: true }, take: 1 } },
  });
  if (!room) return;

  const dueRaw = String(formData.get("dueDate") ?? "").trim();
  const items = parseItems(formData.get("items"));

  const common = {
    rent: Number(formData.get("rent") ?? 0) || 0,
    prevWater: Number(formData.get("prevWater") ?? 0) || 0,
    currWater: Number(formData.get("currWater") ?? 0) || 0,
    prevElec: Number(formData.get("prevElec") ?? 0) || 0,
    currElec: Number(formData.get("currElec") ?? 0) || 0,
    waterRate: Number(formData.get("waterRate") ?? user.waterRate) || 0,
    elecRate: Number(formData.get("elecRate") ?? user.elecRate) || 0,
    other: Number(formData.get("other") ?? 0) || 0,
    otherNote: String(formData.get("otherNote") ?? "").trim() || null,
    waterMeterChanged: Boolean(formData.get("waterMeterChanged")),
    waterOldEnd: Number(formData.get("waterOldEnd") ?? 0) || 0,
    elecMeterChanged: Boolean(formData.get("elecMeterChanged")),
    elecOldEnd: Number(formData.get("elecOldEnd") ?? 0) || 0,
    dueDate: dueRaw ? new Date(dueRaw) : null,
  };

  const invoice = await db.invoice.upsert({
    where: { roomId_period: { roomId, period } },
    update: common,
    create: {
      roomId,
      period,
      tenantId: room.tenants[0]?.id ?? null,
      ...common,
    },
  });

  // แทนที่รายการย่อยทั้งหมดด้วยชุดใหม่
  await db.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
  if (items.length > 0) {
    await db.invoiceItem.createMany({
      data: items.map((it) => ({
        invoiceId: invoice.id,
        label: it.label,
        amount: it.amount,
      })),
    });
  }

  revalidatePath("/", "layout");
}

function parseItems(raw: FormDataEntryValue | null): {
  label: string;
  amount: number;
}[] {
  try {
    const arr = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(arr)) return [];
    return arr
      .map((it) => ({
        label: String(it?.label ?? "").trim(),
        amount: Number(it?.amount) || 0,
      }))
      .filter((it) => it.label !== "");
  } catch {
    return [];
  }
}

export async function togglePaid(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id) return;
  const paid = status === "paid";

  if (paid) {
    // รับชำระ: เก็บรายละเอียดการชำระ (วันที่ ช่องทาง ยอด หมายเหตุ)
    const dateRaw = String(formData.get("paidDate") ?? "").trim();
    const method = String(formData.get("paymentMethod") ?? "").trim() || "เงินสด";
    const amountRaw = formData.get("paidAmount");
    await db.invoice.update({
      where: { id },
      data: {
        status: "paid",
        paidDate: dateRaw ? new Date(dateRaw) : new Date(),
        paymentMethod: method,
        paidAmount: amountRaw != null && String(amountRaw).trim() !== ""
          ? Number(amountRaw) || 0
          : null,
        paymentNote: String(formData.get("paymentNote") ?? "").trim() || null,
        cancelNote: null,
      },
    });
  } else {
    // ยกเลิกชำระ: ต้องมีหมายเหตุกำกับทุกครั้ง
    const cancelNote = String(formData.get("cancelNote") ?? "").trim();
    if (!cancelNote) return;
    await db.invoice.update({
      where: { id },
      data: {
        status: "unpaid",
        paidDate: null,
        paymentMethod: null,
        paidAmount: null,
        paymentNote: null,
        cancelNote,
      },
    });
  }
  revalidatePath("/", "layout");
}

export async function deleteInvoice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.invoice.delete({ where: { id } });
  revalidatePath("/", "layout");
}
