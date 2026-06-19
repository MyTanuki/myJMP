"use client";

import { useState } from "react";
import Modal, { Input, Select } from "@/components/Modal";
import { Badge } from "@/components/ui";
import { createAsset, updateAsset, deleteAsset } from "./actions";

export type AssetRow = {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  condition: string;
  note: string | null;
  roomId: string | null;
  roomNumber: string | null;
};

export type RoomOption = { id: string; number: string };

const CONDITION: Record<string, { label: string; tone: string }> = {
  good: { label: "ดี", tone: "green" },
  fair: { label: "พอใช้", tone: "amber" },
  broken: { label: "ชำรุด", tone: "red" },
};

export default function InventoryClient({
  assets,
  rooms,
}: {
  assets: AssetRow[];
  rooms: RoomOption[];
}) {
  const [editing, setEditing] = useState<AssetRow | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <button
        onClick={() => setAdding(true)}
        className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2.5 rounded-xl transition"
      >
        + เพิ่มทรัพย์สิน
      </button>

      <div className="mt-6 space-y-2">
        {assets.map((a) => (
          <button
            key={a.id}
            onClick={() => setEditing(a)}
            className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-brand-200 hover:shadow transition flex flex-wrap items-center gap-3"
          >
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-slate-50 text-slate-500 shrink-0">
              🗄️
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-800 truncate">
                {a.name}
                <span className="text-slate-400 font-normal"> × {a.quantity}</span>
              </div>
              <div className="text-sm text-slate-400 truncate">
                {a.category ? `${a.category} · ` : ""}
                {a.roomNumber ? `ห้อง ${a.roomNumber}` : "ส่วนกลาง"}
                {a.note ? ` · ${a.note}` : ""}
              </div>
            </div>
            <Badge tone={CONDITION[a.condition]?.tone ?? "slate"}>
              {CONDITION[a.condition]?.label ?? a.condition}
            </Badge>
          </button>
        ))}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="เพิ่มทรัพย์สิน">
        <form
          action={async (fd) => {
            await createAsset(fd);
            setAdding(false);
          }}
          className="space-y-4"
        >
          <AssetFields rooms={rooms} />
          <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
            บันทึก
          </button>
        </form>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="แก้ไขทรัพย์สิน"
      >
        {editing && (
          <form
            action={async (fd) => {
              await updateAsset(fd);
              setEditing(null);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={editing.id} />
            <AssetFields rooms={rooms} asset={editing} />
            <div className="flex items-center gap-2">
              <button className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
                บันทึก
              </button>
              <button
                type="submit"
                formAction={async (fd) => {
                  if (!confirm("ลบทรัพย์สินนี้?\nเมื่อลบแล้วไม่สามารถย้อนกลับได้")) return;
                  await deleteAsset(fd);
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

function AssetFields({
  rooms,
  asset,
}: {
  rooms: RoomOption[];
  asset?: AssetRow;
}) {
  return (
    <>
      <Input label="ชื่อทรัพย์สิน" name="name" defaultValue={asset?.name} required />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="หมวด"
          name="category"
          defaultValue={asset?.category ?? ""}
          placeholder="เฟอร์นิเจอร์, เครื่องใช้ไฟฟ้า"
        />
        <Input
          label="จำนวน"
          name="quantity"
          type="number"
          min={1}
          defaultValue={asset?.quantity ?? 1}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="ห้อง" name="roomId" defaultValue={asset?.roomId ?? ""}>
          <option value="">— ส่วนกลาง —</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              ห้อง {r.number}
            </option>
          ))}
        </Select>
        <Select
          label="สภาพ"
          name="condition"
          defaultValue={asset?.condition ?? "good"}
        >
          <option value="good">ดี</option>
          <option value="fair">พอใช้</option>
          <option value="broken">ชำรุด</option>
        </Select>
      </div>
      <Input label="หมายเหตุ" name="note" defaultValue={asset?.note ?? ""} />
    </>
  );
}
