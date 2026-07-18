"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

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
  await db.invoice.update({
    where: { id },
    data: {
      status: paid ? "paid" : "unpaid",
      paidDate: paid ? new Date() : null,
    },
  });
  revalidatePath("/", "layout");
}

export async function deleteInvoice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.invoice.delete({ where: { id } });
  revalidatePath("/", "layout");
}
