"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { saveBuildingAccess } from "./actions";

export type MatrixUser = {
  id: string;
  name: string;
  role: string;
  buildings: string[];
};

const ROLE_TONE: Record<string, string> = {
  admin: "red",
  manager: "blue",
  staff: "slate",
};

export default function BuildingMatrix({
  users,
  buildings,
}: {
  users: MatrixUser[];
  buildings: string[];
}) {
  const [sel, setSel] = useState<Record<string, Set<string>>>(() => {
    const m: Record<string, Set<string>> = {};
    for (const u of users) m[u.id] = new Set(u.buildings);
    return m;
  });
  const [saved, setSaved] = useState(false);

  if (buildings.length === 0) return null;

  const toggle = (uid: string, b: string) =>
    setSel((prev) => {
      const s = new Set(prev[uid]);
      if (s.has(b)) s.delete(b);
      else s.add(b);
      return { ...prev, [uid]: s };
    });

  const payload = Object.fromEntries(
    users
      .filter((u) => u.role !== "admin")
      .map((u) => [u.id, [...(sel[u.id] ?? [])]])
  );

  return (
    <form
      action={async (fd) => {
        await saveBuildingAccess(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="mt-8"
    >
      <div className="font-semibold text-slate-800 mb-1">สิทธิ์เข้าถึงอาคาร</div>
      <p className="text-xs text-slate-400 mb-3">
        ติ๊กอาคารที่ผู้ใช้แต่ละคนเข้าถึงได้ · ไม่ติ๊กเลย = เข้าถึงทุกอาคาร ·
        ผู้ดูแลระบบเข้าถึงทุกอาคารเสมอ
      </p>
      <input type="hidden" name="matrix" value={JSON.stringify(payload)} />

      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100">
              <th className="text-left font-medium px-4 py-3">ผู้ใช้</th>
              {buildings.map((b) => (
                <th key={b} className="font-medium px-4 py-3 text-center">
                  อาคาร {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-700">{u.name}</span>{" "}
                  <Badge tone={ROLE_TONE[u.role] ?? "slate"}>
                    {u.role === "admin"
                      ? "ผู้ดูแลระบบ"
                      : u.role === "manager"
                        ? "ผู้จัดการ"
                        : "พนักงาน"}
                  </Badge>
                </td>
                {buildings.map((b) =>
                  u.role === "admin" ? (
                    <td key={b} className="px-4 py-3 text-center text-slate-300">
                      ทุกอาคาร
                    </td>
                  ) : (
                    <td key={b} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={sel[u.id]?.has(b) ?? false}
                        onChange={() => toggle(u.id, b)}
                        className="w-4 h-4 accent-brand-600 cursor-pointer"
                      />
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3 mt-3">
        {saved && <span className="text-sm text-emerald-600">บันทึกแล้ว</span>}
        <button className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-2.5 rounded-xl transition">
          บันทึกสิทธิ์
        </button>
      </div>
    </form>
  );
}
