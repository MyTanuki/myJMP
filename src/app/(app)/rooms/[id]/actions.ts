"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

function str(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}
function dateOrNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s ? new Date(s) : null;
}
function numOrNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function updateContract(formData: FormData) {
  const user = await currentUser();
  if (!user) return;
  const tenantId = String(formData.get("tenantId") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  if (!tenantId) return;

  const name = String(formData.get("name") ?? "").trim();
  const moveInDate = dateOrNull(formData.get("moveInDate"));

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      ...(name ? { name } : {}),
      ...(moveInDate ? { moveInDate } : {}),
      phone: str(formData.get("phone")),
      idCard: str(formData.get("idCard")),
      deposit: Number(formData.get("deposit") ?? 0) || 0,
      contractStart: dateOrNull(formData.get("contractStart")),
      contractEnd: dateOrNull(formData.get("contractEnd")),
      moveInWater: numOrNull(formData.get("moveInWater")),
      moveInElec: numOrNull(formData.get("moveInElec")),
      contractNote: str(formData.get("contractNote")),
    },
  });

  revalidatePath("/", "layout");
  if (roomId) revalidatePath(`/rooms/${roomId}`);
}

// บันทึกข้อความสัญญาเฉพาะห้อง (ว่าง = กลับไปใช้เทมเพลตเริ่มต้น)
export async function saveContractBody(formData: FormData) {
  const user = await currentUser();
  if (!user) return;
  const tenantId = String(formData.get("tenantId") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  if (!tenantId) return;

  const body = String(formData.get("body") ?? "").trim();
  await db.tenant.update({
    where: { id: tenantId },
    data: { contractBody: body === "" || body === "<p></p>" ? null : body },
  });

  revalidatePath("/", "layout");
  if (roomId) revalidatePath(`/rooms/${roomId}`);
}

export async function toggleDepositPaid(formData: FormData) {
  const tenantId = String(formData.get("tenantId") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  if (!tenantId) return;
  const paid = String(formData.get("paid") ?? "") === "true";
  await db.tenant.update({ where: { id: tenantId }, data: { depositPaid: paid } });
  revalidatePath("/", "layout");
  if (roomId) revalidatePath(`/rooms/${roomId}`);
}

export async function saveMoveInItems(formData: FormData) {
  const tenantId = String(formData.get("tenantId") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  if (!tenantId) return;

  let items: { label: string; amount: number }[] = [];
  try {
    const arr = JSON.parse(String(formData.get("items") ?? "[]"));
    if (Array.isArray(arr)) {
      items = arr
        .map((it) => ({
          label: String(it?.label ?? "").trim(),
          amount: Number(it?.amount) || 0,
        }))
        .filter((it) => it.label !== "");
    }
  } catch {
    items = [];
  }

  await db.moveInItem.deleteMany({ where: { tenantId } });
  if (items.length > 0) {
    await db.moveInItem.createMany({
      data: items.map((it) => ({ tenantId, label: it.label, amount: it.amount })),
    });
  }

  revalidatePath("/", "layout");
  if (roomId) revalidatePath(`/rooms/${roomId}`);
}

export async function moveOutTenant(formData: FormData) {
  const tenantId = String(formData.get("tenantId") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  if (!tenantId) return;
  await db.tenant.update({ where: { id: tenantId }, data: { active: false } });
  revalidatePath("/", "layout");
  if (roomId) revalidatePath(`/rooms/${roomId}`);
}

// ย้ายออกพร้อมเคลียร์ยอด: หักบิลค้างจากเงินประกัน + ค่าเสียหาย/รายการเพิ่ม แล้วปิดผู้เช่า
export async function settleMoveOut(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const tenantId = String(formData.get("tenantId") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  if (!tenantId) return;

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || !tenant.active) return;

  const moveOutDate = dateOrNull(formData.get("moveOutDate")) ?? new Date();

  let summary: {
    deductedInvoiceIds: string[];
    damages: { label: string; amount: number }[];
    extras: { label: string; amount: number }[];
    deposit?: number;
    refund?: number;
  };
  try {
    const raw = JSON.parse(String(formData.get("summary") ?? "{}"));
    summary = {
      deductedInvoiceIds: Array.isArray(raw?.deductedInvoiceIds)
        ? raw.deductedInvoiceIds.map(String)
        : [],
      damages: Array.isArray(raw?.damages)
        ? raw.damages
            .map((d: unknown) => {
              const x = d as { label?: unknown; amount?: unknown };
              return {
                label: String(x?.label ?? "").trim(),
                amount: Number(x?.amount) || 0,
              };
            })
            .filter((d: { label: string; amount: number }) => d.label && d.amount !== 0)
        : [],
      extras: Array.isArray(raw?.extras)
        ? raw.extras
            .map((d: unknown) => {
              const x = d as { label?: unknown; amount?: unknown };
              return {
                label: String(x?.label ?? "").trim(),
                amount: Number(x?.amount) || 0,
              };
            })
            .filter((d: { label: string; amount: number }) => d.label && d.amount !== 0)
        : [],
      deposit: Number(raw?.deposit) || 0,
      refund: Number(raw?.refund) || 0,
    };
  } catch {
    summary = { deductedInvoiceIds: [], damages: [], extras: [] };
  }

  // บิลที่เลือก "หักจากเงินประกัน" → ทำเครื่องหมายชำระแล้ว ณ วันย้ายออก
  if (summary.deductedInvoiceIds.length > 0) {
    await db.invoice.updateMany({
      where: {
        id: { in: summary.deductedInvoiceIds },
        roomId: tenant.roomId ?? undefined,
        status: { not: "paid" },
      },
      data: { status: "paid", paidDate: moveOutDate },
    });
  }

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      active: false,
      moveOutDate,
      moveOutNote: JSON.stringify(summary),
    },
  });

  revalidatePath("/", "layout");
  if (roomId) revalidatePath(`/rooms/${roomId}`);
}
