"use client";

import { useMemo, useState } from "react";
import Modal, { Input, Select, Textarea } from "@/components/Modal";
import DatePicker from "@/components/DatePicker";
import { Badge } from "@/components/ui";
import SaveButton from "@/components/SaveButton";
import { thaiDate } from "@/lib/format";
import { createIssue, updateIssue, deleteIssue } from "./actions";

export type IssueRow = {
  id: string;
  title: string;
  detail: string | null;
  type: string;
  status: string;
  priority: string;
  appointmentDate: string | null;
  assignee: string | null;
  createdAt: string;
  resolvedAt: string | null;
  roomId: string | null;
  roomNumber: string | null;
};

export type RoomOption = { id: string; number: string };

const TYPE: Record<string, { label: string; tone: string; icon: string }> = {
  fix: { label: "แจ้งซ่อม", tone: "blue", icon: "🔧" },
  cleaning: { label: "แจ้งทำความสะอาด", tone: "green", icon: "🧹" },
  moveout: { label: "แจ้งย้ายออก", tone: "amber", icon: "🚪" },
  other: { label: "แจ้งอื่นๆ/ฉุกเฉิน", tone: "red", icon: "🚨" },
};

const STATUS: Record<string, { label: string; tone: string }> = {
  open: { label: "รอดำเนินการ", tone: "red" },
  in_progress: { label: "กำลังดำเนินการ", tone: "amber" },
  done: { label: "เสร็จสิ้น", tone: "green" },
};

const PRIORITY: Record<string, { label: string; tone: string }> = {
  low: { label: "ต่ำ", tone: "slate" },
  normal: { label: "ปกติ", tone: "blue" },
  high: { label: "ด่วน", tone: "red" },
};

// "แจ้งเมื่อ X ที่แล้ว" แบบต้นแบบ
function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const day = Math.floor(ms / 86400000);
  if (day <= 0) {
    const hr = Math.floor(ms / 3600000);
    return hr <= 0 ? "ไม่กี่นาทีที่แล้ว" : `${hr} ชั่วโมงที่แล้ว`;
  }
  if (day < 30) return `${day} วันที่แล้ว`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} เดือนที่แล้ว`;
  return `${Math.floor(mo / 12)} ปีที่แล้ว`;
}

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

  // แท็บประเภทแบบต้นแบบ + ชุดฟิลเตอร์
  const [typeTab, setTypeTab] = useState<string>("all");
  const [fRoom, setFRoom] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fAssignee, setFAssignee] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fApptFrom, setFApptFrom] = useState("");
  const [fApptTo, setFApptTo] = useState("");
  const [q, setQ] = useState("");

  const resetFilters = () => {
    setFRoom("");
    setFStatus("");
    setFAssignee("");
    setFFrom("");
    setFTo("");
    setFApptFrom("");
    setFApptTo("");
    setQ("");
  };

  const assignees = useMemo(
    () => [...new Set(issues.map((i) => i.assignee).filter(Boolean))] as string[],
    [issues]
  );

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const inRange = (iso: string | null, from: string, to: string) => {
      if (!from && !to) return true;
      if (!iso) return false;
      const d = iso.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };
    return issues.filter((i) => {
      if (typeTab !== "all" && i.type !== typeTab) return false;
      if (fRoom === "common" && i.roomId) return false;
      if (fRoom && fRoom !== "common" && i.roomId !== fRoom) return false;
      if (fStatus && i.status !== fStatus) return false;
      if (fAssignee && i.assignee !== fAssignee) return false;
      if (!inRange(i.createdAt, fFrom, fTo)) return false;
      if (!inRange(i.appointmentDate, fApptFrom, fApptTo)) return false;
      if (
        kw &&
        !i.title.toLowerCase().includes(kw) &&
        !(i.detail ?? "").toLowerCase().includes(kw) &&
        !(i.roomNumber ?? "").toLowerCase().includes(kw) &&
        !(i.assignee ?? "").toLowerCase().includes(kw)
      )
        return false;
      return true;
    });
  }, [issues, typeTab, fRoom, fStatus, fAssignee, fFrom, fTo, fApptFrom, fApptTo, q]);

  // ดาวน์โหลด Excel (CSV + BOM เปิดใน Excel ได้ ภาษาไทยไม่เพี้ยน)
  const exportExcel = () => {
    const esc = (v: string | null | undefined) =>
      `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["ประเภท", "ห้อง", "หัวข้อ", "รายละเอียด", "สถานะ", "ความสำคัญ", "ผู้ดำเนินการ", "วันที่แจ้ง", "วันที่นัดหมาย", "เสร็จเมื่อ"],
      ...list.map((i) => [
        TYPE[i.type]?.label ?? i.type,
        i.roomNumber ?? "ส่วนกลาง",
        i.title,
        i.detail ?? "",
        STATUS[i.status]?.label ?? i.status,
        PRIORITY[i.priority]?.label ?? i.priority,
        i.assignee ?? "",
        thaiDate(i.createdAt),
        i.appointmentDate ? thaiDate(i.appointmentDate) : "",
        i.resolvedAt ? thaiDate(i.resolvedAt) : "",
      ]),
    ];
    const csv = "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `การแจ้ง-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputCls =
    "rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white";

  return (
    <>
      {/* แท็บประเภทการแจ้งแบบต้นแบบ */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "ทั้งหมด" },
          ...Object.entries(TYPE).map(([key, t]) => ({ key, label: t.label })),
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTypeTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition border ${
              typeTab === t.key
                ? "bg-brand-600 border-brand-600 text-white shadow"
                : "bg-white border-slate-200 text-slate-600 hover:border-brand-300"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={exportExcel}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700 transition"
        >
          📥 ดาวน์โหลด Excel
        </button>
        <button
          onClick={() => setAdding(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-xl transition"
        >
          + เพิ่มรายการ
        </button>
      </div>

      {/* ฟิลเตอร์แบบต้นแบบ: ห้อง / สถานะ / วันที่แจ้ง / วันที่นัดหมาย / ผู้ดำเนินการ */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา หัวข้อ/ห้อง/ผู้ดำเนินการ"
          className={`${inputCls} w-52`}
        />
        <select value={fRoom} onChange={(e) => setFRoom(e.target.value)} className={inputCls}>
          <option value="">ทุกห้อง</option>
          <option value="common">ส่วนกลาง</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              ห้อง {r.number}
            </option>
          ))}
        </select>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={inputCls}>
          <option value="">ทุกสถานะ</option>
          {Object.entries(STATUS).map(([k, s]) => (
            <option key={k} value={k}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={fAssignee}
          onChange={(e) => setFAssignee(e.target.value)}
          className={inputCls}
        >
          <option value="">ทุกผู้ดำเนินการ</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <span className="flex items-center gap-1 text-slate-400">
          แจ้ง
          <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className={inputCls} />
          –
          <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className={inputCls} />
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          นัดหมาย
          <input type="date" value={fApptFrom} onChange={(e) => setFApptFrom(e.target.value)} className={inputCls} />
          –
          <input type="date" value={fApptTo} onChange={(e) => setFApptTo(e.target.value)} className={inputCls} />
        </span>
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:border-brand-300 hover:text-brand-700 transition"
        >
          ↺ รีเซ็ต
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {list.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center">ไม่พบรายการตามเงื่อนไข</p>
        )}
        {list.map((i) => (
          <button
            key={i.id}
            onClick={() => setEditing(i)}
            className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-brand-200 hover:shadow transition flex flex-wrap items-center gap-3"
          >
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-slate-50 text-slate-500 shrink-0">
              {TYPE[i.type]?.icon ?? "🔔"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-800 truncate flex items-center gap-2">
                <Badge tone={TYPE[i.type]?.tone ?? "slate"}>
                  {TYPE[i.type]?.label ?? i.type}
                </Badge>
                <span className="text-slate-500 text-sm">
                  {i.roomNumber ? `ห้อง ${i.roomNumber}` : "ส่วนกลาง"}
                </span>
                {i.priority === "high" && (
                  <Badge tone="red">{PRIORITY.high.label}</Badge>
                )}
              </div>
              <div className="mt-0.5 text-slate-700 truncate">{i.title}</div>
              <div className="text-xs text-slate-400 truncate">
                แจ้งเมื่อ {timeAgo(i.createdAt)}
                {i.appointmentDate && ` · นัดหมาย ${thaiDate(i.appointmentDate)}`}
                {i.assignee && ` · ผู้ดำเนินการ ${i.assignee}`}
              </div>
            </div>
            <Badge tone={STATUS[i.status]?.tone ?? "slate"}>
              {STATUS[i.status]?.label ?? i.status}
            </Badge>
          </button>
        ))}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="เพิ่มรายการแจ้ง">
        <form
          action={async (fd) => {
            await createIssue(fd);
            setAdding(false);
          }}
          className="space-y-4"
        >
          <IssueFields rooms={rooms} lockRoom={lockRoom} defaultType={typeTab !== "all" ? typeTab : "fix"} />
          <SaveButton className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
            บันทึก
          </SaveButton>
        </form>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="รายละเอียดการแจ้ง"
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
                  if (!confirm("ลบรายการแจ้งนี้?\nเมื่อลบแล้วไม่สามารถย้อนกลับได้")) return;
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
  defaultType,
}: {
  rooms: RoomOption[];
  issue?: IssueRow;
  withStatus?: boolean;
  lockRoom?: RoomOption;
  defaultType?: string;
}) {
  return (
    <>
      <Select
        label="ประเภทการแจ้ง"
        name="type"
        defaultValue={issue?.type ?? defaultType ?? "fix"}
      >
        {Object.entries(TYPE).map(([k, t]) => (
          <option key={k} value={k}>
            {t.icon} {t.label}
          </option>
        ))}
      </Select>
      <Input label="หัวข้อ" name="title" defaultValue={issue?.title} required />
      <Textarea
        label="รายละเอียด / ข้อมูลเพิ่มเติม"
        name="detail"
        defaultValue={issue?.detail ?? ""}
        placeholder="อธิบายอาการ จุดที่ต้องดำเนินการ หรือข้อมูลเพิ่มเติม…"
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
            label="ห้อง"
            name="roomId"
            defaultValue={issue?.roomId ?? ""}
          >
            <option value="">ส่วนกลาง (ไม่ระบุห้อง)</option>
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
      <div className="grid grid-cols-2 gap-3">
        <DatePicker
          label="วันที่นัดหมาย"
          name="appointmentDate"
          defaultValue={issue?.appointmentDate ? issue.appointmentDate.slice(0, 10) : ""}
        />
        <Input
          label="ผู้ดำเนินการ"
          name="assignee"
          defaultValue={issue?.assignee ?? ""}
          placeholder="เช่น ช่างสมชาย"
        />
      </div>
      {withStatus && (
        <Select label="สถานะ" name="status" defaultValue={issue?.status ?? "open"}>
          <option value="open">รอดำเนินการ</option>
          <option value="in_progress">กำลังดำเนินการ</option>
          <option value="done">เสร็จสิ้น</option>
        </Select>
      )}
    </>
  );
}
