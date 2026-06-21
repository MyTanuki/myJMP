"use client";

import { useState } from "react";
import Modal, { Input, Select, Textarea } from "@/components/Modal";
import { Badge } from "@/components/ui";
import SaveButton from "@/components/SaveButton";
import { thaiDate } from "@/lib/format";
import { createIssue, updateIssue, deleteIssue } from "./actions";

export type IssueRow = {
  id: string;
  title: string;
  detail: string | null;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt: string | null;
  roomId: string | null;
  roomNumber: string | null;
};

export type RoomOption = { id: string; number: string };

const STATUS: Record<string, { label: string; tone: string }> = {
  open: { label: "รอดำเนินการ", tone: "red" },
  in_progress: { label: "กำลังซ่อม", tone: "amber" },
  done: { label: "เสร็จแล้ว", tone: "green" },
};

const PRIORITY: Record<string, { label: string; tone: string }> = {
  low: { label: "ต่ำ", tone: "slate" },
  normal: { label: "ปกติ", tone: "blue" },
  high: { label: "ด่วน", tone: "red" },
};

export default function IssuesClient({
  issues,
  rooms,
  lockRoom,
}: {
  issues: IssueRow[];
  rooms: RoomOption[];
  lockRoom?: RoomOption;
}) {
  const [editing, setEditing] = useState<IssueRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<string>("active");

  const list = issues.filter((i) =>
    filter === "active" ? i.status !== "done" : filter === "all" ? true : i.status === filter
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setAdding(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2.5 rounded-xl transition"
        >
          + แจ้งซ่อม
        </button>
        <Select
          label=""
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="active">ที่ยังไม่เสร็จ</option>
          <option value="open">รอดำเนินการ</option>
          <option value="in_progress">กำลังซ่อม</option>
          <option value="done">เสร็จแล้ว</option>
          <option value="all">ทั้งหมด</option>
        </Select>
      </div>

      <div className="mt-6 space-y-2">
        {list.map((i) => (
          <button
            key={i.id}
            onClick={() => setEditing(i)}
            className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-brand-200 hover:shadow transition flex flex-wrap items-center gap-3"
          >
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-slate-50 text-slate-500 shrink-0">
              🔧
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-800 truncate flex items-center gap-2">
                {i.title}
                <Badge tone={PRIORITY[i.priority]?.tone ?? "slate"}>
                  {PRIORITY[i.priority]?.label ?? i.priority}
                </Badge>
              </div>
              <div className="text-sm text-slate-400 truncate">
                {i.roomNumber ? `ห้อง ${i.roomNumber} · ` : ""}
                แจ้ง {thaiDate(i.createdAt)}
                {i.detail ? ` · ${i.detail}` : ""}
              </div>
            </div>
            <Badge tone={STATUS[i.status]?.tone ?? "slate"}>
              {STATUS[i.status]?.label ?? i.status}
            </Badge>
          </button>
        ))}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="แจ้งซ่อม">
        <form
          action={async (fd) => {
            await createIssue(fd);
            setAdding(false);
          }}
          className="space-y-4"
        >
          <IssueFields rooms={rooms} lockRoom={lockRoom} />
          <SaveButton className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
            บันทึก
          </SaveButton>
        </form>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="รายละเอียดงานซ่อม"
      >
        {editing && (
          <form
            action={async (fd) => {
              await updateIssue(fd);
              setEditing(null);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={editing.id} />
            <IssueFields rooms={rooms} issue={editing} withStatus />
            <div className="flex items-center gap-2">
              <SaveButton className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
                บันทึก
              </SaveButton>
              <button
                type="submit"
                formAction={async (fd) => {
                  if (!confirm("ลบรายการแจ้งซ่อมนี้?\nเมื่อลบแล้วไม่สามารถย้อนกลับได้")) return;
                  await deleteIssue(fd);
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

function IssueFields({
  rooms,
  issue,
  withStatus,
  lockRoom,
}: {
  rooms: RoomOption[];
  issue?: IssueRow;
  withStatus?: boolean;
  lockRoom?: RoomOption;
}) {
  return (
    <>
      <Input label="หัวข้อ" name="title" defaultValue={issue?.title} required />
      <Textarea
        label="รายละเอียด / ข้อมูลเพิ่มเติม"
        name="detail"
        defaultValue={issue?.detail ?? ""}
        placeholder="อธิบายอาการ จุดที่ต้องซ่อม หรือข้อมูลเพิ่มเติม…"
      />
      <div className="grid grid-cols-2 gap-3">
        {lockRoom ? (
          <label className="block">
            <span className="text-sm font-medium text-slate-600">ห้อง</span>
            <div className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700">
              ห้อง {lockRoom.number}
            </div>
            <input type="hidden" name="roomId" value={lockRoom.id} />
          </label>
        ) : (
          <Select
            label="ห้อง (ถ้ามี)"
            name="roomId"
            defaultValue={issue?.roomId ?? ""}
          >
            <option value="">— ไม่ระบุ —</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                ห้อง {r.number}
              </option>
            ))}
          </Select>
        )}
        <Select
          label="ความสำคัญ"
          name="priority"
          defaultValue={issue?.priority ?? "normal"}
        >
          <option value="low">ต่ำ</option>
          <option value="normal">ปกติ</option>
          <option value="high">ด่วน</option>
        </Select>
      </div>
      {withStatus && (
        <Select label="สถานะ" name="status" defaultValue={issue?.status ?? "open"}>
          <option value="open">รอดำเนินการ</option>
          <option value="in_progress">กำลังซ่อม</option>
          <option value="done">เสร็จแล้ว</option>
        </Select>
      )}
    </>
  );
}
