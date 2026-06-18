"use client";

import { useState } from "react";
import Modal, { Input, Select } from "@/components/Modal";
import { Badge } from "@/components/ui";
import { createStaff, updateStaff, deleteStaff } from "./actions";

export type StaffRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  active: boolean;
};

const ROLE: Record<string, { label: string; tone: string }> = {
  admin: { label: "ผู้ดูแลระบบ", tone: "red" },
  manager: { label: "ผู้จัดการ", tone: "blue" },
  staff: { label: "พนักงาน", tone: "slate" },
};

export default function StaffClient({ staff }: { staff: StaffRow[] }) {
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <button
        onClick={() => setAdding(true)}
        className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2.5 rounded-xl transition"
      >
        + เพิ่มพนักงาน
      </button>

      <div className="mt-6 space-y-2">
        {staff.map((s) => (
          <button
            key={s.id}
            onClick={() => setEditing(s)}
            className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-brand-200 hover:shadow transition flex flex-wrap items-center gap-3"
          >
            <div className="grid place-items-center w-11 h-11 rounded-full bg-brand-50 text-brand-700 font-semibold shrink-0">
              {s.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-800 truncate flex items-center gap-2">
                {s.name}
                {!s.active && <Badge tone="slate">ปิดใช้งาน</Badge>}
              </div>
              <div className="text-sm text-slate-400 truncate">
                {[s.email, s.phone].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
            <Badge tone={ROLE[s.role]?.tone ?? "slate"}>
              {ROLE[s.role]?.label ?? s.role}
            </Badge>
          </button>
        ))}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="เพิ่มพนักงาน">
        <form
          action={async (fd) => {
            await createStaff(fd);
            setAdding(false);
          }}
          className="space-y-4"
        >
          <StaffFields />
          <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
            บันทึก
          </button>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="แก้ไขพนักงาน">
        {editing && (
          <form
            action={async (fd) => {
              await updateStaff(fd);
              setEditing(null);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={editing.id} />
            <StaffFields staff={editing} withActive />
            <div className="flex items-center gap-2">
              <button className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
                บันทึก
              </button>
              <button
                type="submit"
                formAction={async (fd) => {
                  await deleteStaff(fd);
                  setEditing(null);
                }}
                className="px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 font-medium transition"
              >
                ลบ
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

function StaffFields({
  staff,
  withActive,
}: {
  staff?: StaffRow;
  withActive?: boolean;
}) {
  return (
    <>
      <Input label="ชื่อ-นามสกุล" name="name" defaultValue={staff?.name} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="อีเมล" name="email" defaultValue={staff?.email ?? ""} />
        <Input label="เบอร์โทร" name="phone" defaultValue={staff?.phone ?? ""} />
      </div>
      <Select label="บทบาท" name="role" defaultValue={staff?.role ?? "staff"}>
        <option value="admin">ผู้ดูแลระบบ (เข้าถึงทุกอย่าง)</option>
        <option value="manager">ผู้จัดการ (จัดการห้อง บิล ผู้เช่า)</option>
        <option value="staff">พนักงาน (งานประจำวัน)</option>
      </Select>
      {withActive && (
        <Select
          label="สถานะ"
          name="active"
          defaultValue={staff?.active ? "true" : "false"}
        >
          <option value="true">ใช้งาน</option>
          <option value="false">ปิดใช้งาน</option>
        </Select>
      )}
    </>
  );
}
