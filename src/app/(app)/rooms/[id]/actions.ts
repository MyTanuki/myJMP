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

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      ...(name ? { name } : {}),
      phone: str(formData.get("phone")),
      idCard: str(formData.get("idCard")),
      address: str(formData.get("address")),
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
