"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

function dateOrNow(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s ? new Date(s) : new Date();
}

export async function createTransaction(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const type = String(formData.get("type") ?? "expense");
  const category = String(formData.get("category") ?? "").trim();
  if (!category) return;

  await db.transaction.create({
    data: {
      type: type === "income" ? "income" : "expense",
      category,
      amount: Number(formData.get("amount") ?? 0) || 0,
      date: dateOrNow(formData.get("date")),
      note: String(formData.get("note") ?? "").trim() || null,
      roomId: String(formData.get("roomId") ?? "").trim() || null,
    },
  });

  revalidatePath("/finance");
  revalidatePath("/reports");
}

export async function updateTransaction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const type = String(formData.get("type") ?? "expense");

  await db.transaction.update({
    where: { id },
    data: {
      type: type === "income" ? "income" : "expense",
      category: String(formData.get("category") ?? "").trim(),
      amount: Number(formData.get("amount") ?? 0) || 0,
      date: dateOrNow(formData.get("date")),
      note: String(formData.get("note") ?? "").trim() || null,
      roomId: String(formData.get("roomId") ?? "").trim() || null,
    },
  });

  revalidatePath("/finance");
  revalidatePath("/reports");
}

export async function deleteTransaction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.transaction.delete({ where: { id } });
  revalidatePath("/finance");
  revalidatePath("/reports");
}
