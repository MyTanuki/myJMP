"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function createIssue(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await db.issue.create({
    data: {
      title,
      detail: String(formData.get("detail") ?? "").trim() || null,
      priority: String(formData.get("priority") ?? "normal"),
      status: "open",
      roomId: String(formData.get("roomId") ?? "").trim() || null,
    },
  });

  revalidatePath("/issues");
}

export async function updateIssue(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const status = String(formData.get("status") ?? "open");

  await db.issue.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      detail: String(formData.get("detail") ?? "").trim() || null,
      priority: String(formData.get("priority") ?? "normal"),
      status,
      roomId: String(formData.get("roomId") ?? "").trim() || null,
      resolvedAt: status === "done" ? new Date() : null,
    },
  });

  revalidatePath("/issues");
}

export async function deleteIssue(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.issue.delete({ where: { id } });
  revalidatePath("/issues");
}
