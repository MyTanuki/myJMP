"use client";

import { useState } from "react";
import Modal, { Input, Select } from "@/components/Modal";
import { Badge } from "@/components/ui";
import { createVehicle, updateVehicle, deleteVehicle } from "./actions";

export type VehicleRow = {
  id: string;
  plate: string;
  kind: string;
  brand: string | null;
  color: string | null;
  note: string | null;
  roomId: string | null;
  roomNumber: string | null;
  tenantId: string | null;
  tenantName: string | null;
};

export type RoomOption = { id: string; number: string };
export type TenantOption = { id: string; name: string };

export default function VehiclesClient({
  vehicles,
  rooms,
  tenants,
}: {
  vehicles: VehicleRow[];
  rooms: RoomOption[];
  tenants: TenantOption[];
}) {
  const [editing, setEditing] = useState<VehicleRow | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <button
        onClick={() => setAdding(true)}
        className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2.5 rounded-xl transition"
      >
        + ลงทะเบียนรถ
      </button>

      <div className="mt-6 space-y-2">
        {vehicles.map((v) => (
          <button
            key={v.id}
            onClick={() => setEditing(v)}
            className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-brand-200 hover:shadow transition flex flex-wrap items-center gap-3"
          >
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-slate-50 shrink-0">
              {v.kind === "motorcycle" ? "🏍️" : "🚗"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-800 truncate">
                {v.plate}
                {v.brand || v.color ? (
                  <span className="text-slate-400 font-normal">
                    {" "}
                    · {[v.brand, v.color].filter(Boolean).join(" ")}
                  </span>
                ) : null}
              </div>
              <div className="text-sm text-slate-400 truncate">
                {v.tenantName ? `${v.tenantName} · ` : ""}
                {v.roomNumber ? `ห้อง ${v.roomNumber}` : "ไม่ระบุห้อง"}
                {v.note ? ` · ${v.note}` : ""}
              </div>
            </div>
            <Badge tone="blue">
              {v.kind === "motorcycle" ? "มอเตอร์ไซค์" : "รถยนต์"}
            </Badge>
          </button>
        ))}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="ลงทะเบียนรถ">
        <form
          action={async (fd) => {
            await createVehicle(fd);
            setAdding(false);
          }}
          className="space-y-4"
        >
          <VehicleFields rooms={rooms} tenants={tenants} />
          <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
            บันทึก
          </button>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="แก้ไขข้อมูลรถ">
        {editing && (
          <form
            action={async (fd) => {
              await updateVehicle(fd);
              setEditing(null);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={editing.id} />
            <VehicleFields rooms={rooms} tenants={tenants} vehicle={editing} />
            <div className="flex items-center gap-2">
              <button className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
                บันทึก
              </button>
              <button
                type="submit"
                formAction={async (fd) => {
                  await deleteVehicle(fd);
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

function VehicleFields({
  rooms,
  tenants,
  vehicle,
}: {
  rooms: RoomOption[];
  tenants: TenantOption[];
  vehicle?: VehicleRow;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Input label="ทะเบียนรถ" name="plate" defaultValue={vehicle?.plate} required />
        <Select label="ประเภท" name="kind" defaultValue={vehicle?.kind ?? "car"}>
          <option value="car">รถยนต์</option>
          <option value="motorcycle">มอเตอร์ไซค์</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="ยี่ห้อ/รุ่น" name="brand" defaultValue={vehicle?.brand ?? ""} />
        <Input label="สี" name="color" defaultValue={vehicle?.color ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="ห้อง" name="roomId" defaultValue={vehicle?.roomId ?? ""}>
          <option value="">— ไม่ระบุ —</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              ห้อง {r.number}
            </option>
          ))}
        </Select>
        <Select
          label="ผู้เช่า"
          name="tenantId"
          defaultValue={vehicle?.tenantId ?? ""}
        >
          <option value="">— ไม่ระบุ —</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>
      <Input label="หมายเหตุ" name="note" defaultValue={vehicle?.note ?? ""} />
    </>
  );
}
