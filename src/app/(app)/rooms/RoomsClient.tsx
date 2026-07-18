"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Modal, { Input, Select } from "@/components/Modal";
import SaveButton from "@/components/SaveButton";
import { baht, roomLabel } from "@/lib/format";
import { updateRoom, generatePortalLink } from "./actions";

export type RoomStatus = "vacant" | "booked" | "paid" | "unpaid" | "nobill";

export type RoomRow = {
  id: string;
  building: string;
  number: string;
  floor: number;
  hasRepair: boolean;
  type: string;
  basePrice: number;
  rentFurniture: number;
  rentCommon: number;
  rentAircon: number;
  rentFridge: number;
  rentTv: number;
  rentDiscount: number;
  rentTotal: number;
  waterRate: number | null;
  elecRate: number | null;
  note: string | null;
  publicToken: string | null;
  tenant: string | null;
  status: RoomStatus;
  contractExpiring: boolean; // สัญญาหมดภายใน 30 วัน
};

const TYPES = ["ห้องพัดลม", "ห้องแอร์", "สตูดิโอ", "ห้องครัวรวม"];

const STATUS: Record<
  RoomStatus,
  { label: string; dot: string; card: string; accent: string }
> = {
  vacant: {
    label: "ว่าง",
    dot: "bg-slate-300",
    card: "bg-slate-50 border-slate-200 hover:border-slate-300",
    accent: "text-slate-500",
  },
  booked: {
    label: "จองแล้ว",
    dot: "bg-sky-400",
    card: "bg-sky-50 border-sky-200 hover:border-sky-300",
    accent: "text-sky-700",
  },
  paid: {
    label: "ชำระแล้ว",
    dot: "bg-emerald-500",
    card: "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
    accent: "text-emerald-700",
  },
  unpaid: {
    label: "ค้างชำระ",
    dot: "bg-red-500",
    card: "bg-red-50 border-red-200 hover:border-red-300",
    accent: "text-red-700",
  },
  nobill: {
    label: "ยังไม่ออกบิล",
    dot: "bg-amber-400",
    card: "bg-amber-50 border-amber-200 hover:border-amber-300",
    accent: "text-amber-700",
  },
};

type Filter = "all" | RoomStatus | "expiring";

export default function RoomsClient({ rooms }: { rooms: RoomRow[] }) {
  const [editing, setEditing] = useState<RoomRow | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  // สถิติแบบต้นแบบ: อัตราเข้าพัก / ค้างชำระ / ว่าง / จอง / ใกล้หมดสัญญา
  const stats = useMemo(() => {
    const total = rooms.length || 1;
    const occupied = rooms.filter((r) => r.tenant).length;
    return {
      occupancy: Math.round((occupied / total) * 1000) / 10,
      unpaid: rooms.filter((r) => r.status === "unpaid").length,
      vacant: rooms.filter((r) => r.status === "vacant" || r.status === "booked")
        .length,
      booked: rooms.filter((r) => r.status === "booked").length,
      expiring: rooms.filter((r) => r.contractExpiring).length,
    };
  }, [rooms]);

  const visible = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rooms.filter((r) => {
      if (filter === "expiring" && !r.contractExpiring) return false;
      if (filter !== "all" && filter !== "expiring" && r.status !== filter)
        return false;
      if (
        kw &&
        !roomLabel(r.building, r.number).toLowerCase().includes(kw) &&
        !(r.tenant ?? "").toLowerCase().includes(kw)
      )
        return false;
      return true;
    });
  }, [rooms, filter, q]);

  const buildings = useMemo(() => {
    const map = new Map<string, Map<number, RoomRow[]>>();
    for (const r of visible) {
      if (!map.has(r.building)) map.set(r.building, new Map());
      const fl = map.get(r.building)!;
      const list = fl.get(r.floor) ?? [];
      list.push(r);
      fl.set(r.floor, list);
    }
    return [...map.entries()];
  }, [visible]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: `ทั้งหมด (${rooms.length})` },
    { key: "unpaid", label: `ค้างชำระ (${stats.unpaid})` },
    { key: "paid", label: "ชำระแล้ว" },
    { key: "nobill", label: "ยังไม่ออกบิล" },
    { key: "vacant", label: `ว่าง (${stats.vacant - stats.booked})` },
    { key: "booked", label: `จองแล้ว (${stats.booked})` },
    { key: "expiring", label: `ใกล้หมดสัญญา (${stats.expiring})` },
  ];

  return (
    <>
      {/* สถิติรวมแบบต้นแบบ */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="อัตราการเข้าพัก" value={`${stats.occupancy}%`} tone="text-brand-700" />
        <StatBox label="ค้างชำระ" value={`${stats.unpaid} ห้อง`} tone="text-red-600" />
        <StatBox label="ห้องว่าง" value={`${stats.vacant} ห้อง`} tone="text-slate-700" />
        <StatBox label="ห้องจอง" value={`${stats.booked} ห้อง`} tone="text-sky-600" />
      </div>

      {stats.expiring > 0 && (
        <button
          type="button"
          onClick={() => setFilter(filter === "expiring" ? "all" : "expiring")}
          className="mt-3 w-full text-left rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:border-amber-300 transition"
        >
          ⚠️ มีห้องที่ใกล้หมดสัญญาเช่า (ภายใน 30 วัน) จำนวน {stats.expiring} ห้อง —
          กดเพื่อดู
        </button>
      )}

      {/* ค้นหา + ฟิลเตอร์สถานะ */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาห้อง / ชื่อผู้เช่า"
          className="w-56 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition border ${
              filter === f.key
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-brand-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
        {(Object.keys(STATUS) as RoomStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${STATUS[s].dot}`} />
            {STATUS[s].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 repair-blink" />
          รอซ่อม
        </span>
      </div>

      <div className="mt-6 space-y-5">
        {buildings.map(([building, floors]) => (
          <div key={building} className="rounded-xl border border-slate-200 p-4">
            <div className="font-semibold text-slate-700 mb-3">
              อาคาร {building}
            </div>
            <div className="space-y-4">
              {[...floors.entries()].map(([floor, list]) => (
                <div key={floor}>
                  <div className="text-sm font-semibold text-slate-500 mb-2">
                    ชั้น {floor}
                  </div>
                  <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
                    {list.map((r) => {
                      const st = STATUS[r.status];
                      return (
                        <div key={r.id} className="relative">
                          <Link
                            href={`/rooms/${r.id}`}
                            className={`relative block overflow-hidden text-left rounded-2xl border shadow-sm p-4 transition hover:shadow ${st.card}`}
                          >
                            {r.hasRepair && (
                              <span className="absolute inset-0 bg-amber-400 repair-blink pointer-events-none" />
                            )}
                            <div className="relative">
                              <div className="flex items-start justify-between">
                                <div className="text-lg font-bold text-slate-800">
                                  {r.number}
                                </div>
                                <span
                                  className={`w-3 h-3 rounded-full mt-1.5 ${st.dot}`}
                                />
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {r.type}
                              </div>
                              <div
                                className={`mt-2 text-xs font-medium ${st.accent}`}
                              >
                                {st.label}
                              </div>
                              <div className="mt-2 text-sm text-slate-600 truncate pr-12">
                                {r.tenant
                                  ? `👤 ${r.tenant}`
                                  : baht(r.rentTotal) + "/เดือน"}
                              </div>
                              {r.contractExpiring && (
                                <div className="mt-1 text-[10px] font-medium text-amber-600">
                                  ⚠️ ใกล้หมดสัญญา
                                </div>
                              )}
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => setEditing(r)}
                            className="absolute bottom-2 right-2 text-xs text-slate-500 hover:text-brand-700 px-2 py-1 rounded-lg hover:bg-white/70"
                          >
                            ✎ แก้ไข
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* แก้ไขห้อง */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`แก้ไขห้อง ${editing ? roomLabel(editing.building, editing.number) : ""}`}
      >
        {editing && (
          <form
            action={async (fd) => {
              await updateRoom(fd);
              setEditing(null);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={editing.id} />
            <RoomFields room={editing} />
            <div className="flex items-center gap-2 pt-2">
              <SaveButton className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
                บันทึกการแก้ไข
              </SaveButton>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}
        {editing && <PortalLink room={editing} />}
      </Modal>
    </>
  );
}

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-lg font-bold mt-1 ${tone}`}>{value}</div>
    </div>
  );
}

function PortalLink({ room }: { room: RoomRow }) {
  const [copied, setCopied] = useState(false);
  const url = room.publicToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${room.publicToken}`
    : "";

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="text-sm font-medium text-slate-600 mb-2">
        ลิงก์พอร์ทัลผู้เช่า
      </div>
      {room.publicToken ? (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 bg-slate-50"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="px-3 py-2 rounded-lg text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            {copied ? "คัดลอกแล้ว" : "คัดลอก"}
          </button>
        </div>
      ) : (
        <form action={generatePortalLink}>
          <input type="hidden" name="id" value={room.id} />
          <button className="text-sm font-medium text-brand-700 hover:text-brand-800">
            + สร้างลิงก์สำหรับผู้เช่าดูบิลเอง
          </button>
        </form>
      )}
    </div>
  );
}

function RoomFields({ room }: { room?: RoomRow }) {
  return (
    <>
      <Select label="ประเภทห้อง" name="type" defaultValue={room?.type ?? TYPES[0]}>
        {TYPES.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </Select>

      <div className="rounded-xl bg-slate-50 p-3 space-y-3">
        <div className="text-sm font-medium text-slate-600">ค่าเช่าต่อเดือน</div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="ค่าเช่าห้อง" name="basePrice" type="number" defaultValue={room?.basePrice ?? 3000} />
          <Input label="ค่าเช่าเฟอร์นิเจอร์" name="rentFurniture" type="number" defaultValue={room?.rentFurniture ?? 0} />
          <Input label="ค่าสาธารณูปโภคส่วนกลาง" name="rentCommon" type="number" defaultValue={room?.rentCommon ?? 0} />
          <Input label="ค่าเช่าเครื่องปรับอากาศ" name="rentAircon" type="number" defaultValue={room?.rentAircon ?? 0} />
          <Input label="ค่าเช่าตู้เย็น" name="rentFridge" type="number" defaultValue={room?.rentFridge ?? 0} />
          <Input label="ค่าเช่าโทรทัศน์" name="rentTv" type="number" defaultValue={room?.rentTv ?? 0} />
        </div>
        <Input label="ส่วนลดค่าเช่า" name="rentDiscount" type="number" defaultValue={room?.rentDiscount ?? 0} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="ค่าน้ำ/หน่วย (ว่าง=ใช้ค่ากลาง)"
          name="waterRate"
          type="number"
          min={0}
          defaultValue={room?.waterRate ?? ""}
        />
        <Input
          label="ค่าไฟ/หน่วย (ว่าง=ใช้ค่ากลาง)"
          name="elecRate"
          type="number"
          min={0}
          defaultValue={room?.elecRate ?? ""}
        />
      </div>
      <Input label="หมายเหตุ" name="note" defaultValue={room?.note ?? ""} />
    </>
  );
}
