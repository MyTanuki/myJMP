"use client";

import { useState } from "react";
import Modal, { Input, Select } from "@/components/Modal";
import { Badge } from "@/components/ui";
import { createUser, updateUser, deleteUser } from "./actions";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isSelf: boolean;
};

const ROLE: Record<string, { label: string; tone: string }> = {
  admin: { label: "ผู้ดูแลระบบ", tone: "red" },
  manager: { label: "ผู้จัดการ", tone: "blue" },
  staff: { label: "พนักงาน", tone: "slate" },
};

export default function StaffClient({ users }: { users: UserRow[] }) {
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setError(null);
    setAdding(true);
  };
  const openEdit = (u: UserRow) => {
    setError(null);
    setEditing(u);
  };
  const closeAll = () => {
    setError(null);
    setAdding(false);
    setEditing(null);
  };

  return (
    <>
      <button
        onClick={openAdd}
        className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2.5 rounded-xl transition"
      >
        + เพิ่มผู้ใช้
      </button>

      <div className="mt-6 space-y-2">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => openEdit(u)}
            className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-brand-200 hover:shadow transition flex flex-wrap items-center gap-3"
          >
            <div className="grid place-items-center w-11 h-11 rounded-full bg-brand-50 text-brand-700 font-semibold shrink-0">
              {u.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-800 truncate flex items-center gap-2">
                {u.name}
                {u.isSelf && <Badge tone="green">คุณ</Badge>}
              </div>
              <div className="text-sm text-slate-400 truncate">{u.email}</div>
            </div>
            <Badge tone={ROLE[u.role]?.tone ?? "slate"}>
              {ROLE[u.role]?.label ?? u.role}
            </Badge>
          </button>
        ))}
      </div>

      <Modal open={adding} onClose={closeAll} title="เพิ่มผู้ใช้">
        <form
          action={async (fd) => {
            const res = await createUser(fd);
            if (res?.error) setError(res.error);
            else closeAll();
          }}
          className="space-y-4"
        >
          <UserFields />
          <ErrorNote error={error} />
          <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
            สร้างบัญชี
          </button>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={closeAll} title="แก้ไขบัญชีผู้ใช้">
        {editing && (
          <form
            action={async (fd) => {
              const res = await updateUser(fd);
              if (res?.error) setError(res.error);
              else closeAll();
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={editing.id} />
            <UserFields user={editing} />
            <ErrorNote error={error} />
            <div className="flex items-center gap-2">
              <button className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
                บันทึก
              </button>
              {!editing.isSelf && (
                <button
                  type="submit"
                  formAction={async (fd) => {
                    if (
                      !confirm(
                        "ลบบัญชีผู้ใช้นี้?\nผู้ใช้จะเข้าสู่ระบบไม่ได้อีก"
                      )
                    )
                      return;
                    const res = await deleteUser(fd);
                    if (res?.error) setError(res.error);
                    else closeAll();
                  }}
                  className="px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 font-medium transition"
                >
                  ลบ
                </button>
              )}
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
  );
}

function UserFields({ user }: { user?: UserRow }) {
  const isEdit = !!user;
  return (
    <>
      <Input label="ชื่อ-นามสกุล" name="name" defaultValue={user?.name} required />
      <Input
        label="อีเมล (ใช้เข้าสู่ระบบ)"
        name="email"
        type="email"
        defaultValue={user?.email ?? ""}
        required
        autoComplete="off"
      />
      <Input
        label={isEdit ? "รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "รหัสผ่าน"}
        name="password"
        type="password"
        placeholder={isEdit ? "••••••••" : "อย่างน้อย 6 ตัวอักษร"}
        required={!isEdit}
        minLength={6}
        autoComplete="new-password"
      />
      <Select label="บทบาท" name="role" defaultValue={user?.role ?? ""}>
        {!isEdit && <option value="">— เลือกบทบาท —</option>}
        <option value="admin">ผู้ดูแลระบบ (เข้าถึงทุกอย่าง)</option>
        <option value="manager">ผู้จัดการ (ห้อง บิล ผู้เช่า รายงาน)</option>
        <option value="staff">พนักงาน (งานประจำวัน)</option>
      </Select>
      {user?.isSelf && (
        <p className="text-xs text-slate-400">
          นี่คือบัญชีของคุณ — เปลี่ยนบทบาทตัวเองหรือลบบัญชีตัวเองไม่ได้
        </p>
      )}
    </>
  );
}
