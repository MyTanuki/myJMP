"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

const TYPES = ["fix", "cleaning", "moveout", "other"];

function dateOrNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s ? new Date(s) : null;
}

export async function createIssue(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const type = String(formData.get("type") ?? "fix");

  await db.issue.create({
    data: {
      title,
      detail: String(formData.get("detail") ?? "").trim() || null,
      type: TYPES.includes(type) ? type : "fix",
      priority: String(formData.get("priority") ?? "normal"),
      status: "open",
      roomId: String(formData.get("roomId") ?? "").trim() || null,
      appointmentDate: dateOrNull(formData.get("appointmentDate")),
      assignee: String(formData.get("assignee") ?? "").trim() || null,
    },
  });

  revalidatePath("/", "layout");
}

export async function updateIssue(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const status = String(formData.get("status") ?? "open");
  const type = String(formData.get("type") ?? "fix");

  await db.issue.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      detail: String(formData.get("detail") ?? "").trim() || null,
      type: TYPES.includes(type) ? type : "fix",
      priority: String(formData.get("priority") ?? "normal"),
      status,
      roomId: String(formData.get("roomId") ?? "").trim() || null,
      appointmentDate: dateOrNull(formData.get("appointmentDate")),
      assignee: String(formData.get("assignee") ?? "").trim() || null,
      resolvedAt: status === "done" ? new Date() : null,
    },
  });

  revalidatePath("/", "layout");
}

export async function deleteIssue(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.issue.delete({ where: { id } });
  revalidatePath("/", "layout");
}
