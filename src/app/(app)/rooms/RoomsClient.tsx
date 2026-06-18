"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Modal, { Input, Select } from "@/components/Modal";
import { baht, roomLabel } from "@/lib/format";
import { createRoom, updateRoom, generatePortalLink } from "./actions";

export type RoomStatus = "vacant" | "paid" | "unpaid" | "nobill";

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

export default function RoomsClient({ rooms }: { rooms: RoomRow[] }) {
  const [editing, setEditing] = useState<RoomRow | null>(null);
  const [adding, setAdding] = useState(false);

  const buildings = useMemo(() => {
    const map = new Map<string, Map<number, RoomRow[]>>();
    for (const r of rooms) {
      if (!map.has(r.building)) map.set(r.building, new Map());
      const fl = map.get(r.building)!;
      const list = fl.get(r.floor) ?? [];
      list.push(r);
      fl.set(r.floor, list);
    }
    return [...map.entries()];
  }, [rooms]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
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
        <button
          onClick={() => setAdding(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2.5 rounded-xl transition"
        >
          + เพิ่มห้อง
        </button>
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
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
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

      {/* เพิ่มห้อง */}
      <Modal open={adding} onClose={() => setAdding(false)} title="เพิ่มห้องพัก">
        <form
          action={async (fd) => {
            await createRoom(fd);
            setAdding(false);
          }}
          className="space-y-4"
        >
          <RoomFields />
          <SubmitRow label="บันทึก" />
        </form>
      </Modal>

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
              <button className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
                บันทึกการแก้ไข
              </button>
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
      {!room && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="เลขห้อง" name="number" required />
          <Input label="ชั้น" name="floor" type="number" min={1} defaultValue={1} />
        </div>
      )}
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

function SubmitRow({ label }: { label: string }) {
  return (
    <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
      {label}
    </button>
  );
}
