"use client";

import { useState } from "react";
import Modal, { Input, Select } from "@/components/Modal";
import { Badge } from "@/components/ui";
import { thaiDate } from "@/lib/format";
import { createParcel, togglePickup, deleteParcel } from "./actions";

export type ParcelRow = {
  id: string;
  recipient: string;
  carrier: string | null;
  arrivedAt: string;
  pickedUp: boolean;
  pickedUpAt: string | null;
  note: string | null;
  roomNumber: string | null;
};

export type RoomOption = { id: string; number: string };

export default function ParcelsClient({
  parcels,
  rooms,
}: {
  parcels: ParcelRow[];
  rooms: RoomOption[];
}) {
  const [adding, setAdding] = useState(false);
  const [showPicked, setShowPicked] = useState(false);

  const list = parcels.filter((p) => (showPicked ? true : !p.pickedUp));

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setAdding(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2.5 rounded-xl transition"
        >
          + รับพัสดุเข้า
        </button>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          <input
            type="checkbox"
            checked={showPicked}
            onChange={(e) => setShowPicked(e.target.checked)}
          />
          แสดงที่รับแล้ว
        </label>
      </div>

      <div className="mt-6 space-y-2">
        {list.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center gap-3"
          >
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600 shrink-0">
              📦
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-800 truncate">
                {p.recipient}
                {p.roomNumber ? (
                  <span className="text-slate-400 font-normal">
                    {" "}
                    · ห้อง {p.roomNumber}
                  </span>
                ) : null}
              </div>
              <div className="text-sm text-slate-400 truncate">
                {p.carrier ? `${p.carrier} · ` : ""}
                ถึง {thaiDate(p.arrivedAt)}
                {p.note ? ` · ${p.note}` : ""}
              </div>
            </div>
            {p.pickedUp ? (
              <Badge tone="green">รับแล้ว</Badge>
            ) : (
              <Badge tone="amber">รอรับ</Badge>
            )}
            <form action={togglePickup}>
              <input type="hidden" name="id" value={p.id} />
              <input
                type="hidden"
                name="pickedUp"
                value={(!p.pickedUp).toString()}
              />
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium text-brand-700 hover:bg-brand-50 transition">
                {p.pickedUp ? "ยังไม่รับ" : "ทำเครื่องหมายรับแล้ว"}
              </button>
            </form>
            <form action={deleteParcel}>
              <input type="hidden" name="id" value={p.id} />
              <button className="px-2 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition">
                ลบ
              </button>
            </form>
          </div>
        ))}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="รับพัสดุเข้า">
        <form
          action={async (fd) => {
            await createParcel(fd);
            setAdding(false);
          }}
          className="space-y-4"
        >
          <Input label="ชื่อผู้รับ" name="recipient" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="ขนส่ง" name="carrier" placeholder="Flash, Kerry..." />
            <Select label="ห้อง (ถ้ามี)" name="roomId" defaultValue="">
              <option value="">— ไม่ระบุ —</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  ห้อง {r.number}
                </option>
              ))}
            </Select>
          </div>
          <Input label="หมายเหตุ" name="note" />
          <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
            บันทึก
          </button>
        </form>
      </Modal>
    </>
  );
}
