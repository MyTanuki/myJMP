"use client";

import { useState } from "react";
import Modal, { Input, Select } from "@/components/Modal";
import { Badge } from "@/components/ui";
import { baht, thaiDate } from "@/lib/format";
import {
  createTenant,
  updateTenant,
  moveOut,
  deleteTenant,
} from "./actions";

export type TenantRow = {
  id: string;
  name: string;
  phone: string | null;
  idCard: string | null;
  vehiclePlate: string | null;
  deposit: number;
  moveInDate: string;
  contractStart: string | null;
  contractEnd: string | null;
  active: boolean;
  roomId: string;
  roomNumber: string;
};

export type RoomOption = { id: string; number: string };

function toInput(d: string | null) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default function TenantsClient({
  tenants,
  rooms,
}: {
  tenants: TenantRow[];
  rooms: RoomOption[];
}) {
  const [editing, setEditing] = useState<TenantRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const list = tenants.filter((t) => (showInactive ? true : t.active));

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setAdding(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2.5 rounded-xl transition"
        >
          + เพิ่มผู้เช่า
        </button>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          แสดงผู้ที่ย้ายออกแล้ว
        </label>
      </div>

      <div className="mt-6 space-y-3">
        {list.map((t) => (
          <button
            key={t.id}
            onClick={() => setEditing(t)}
            className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-brand-200 hover:shadow transition flex flex-wrap items-center gap-3"
          >
            <div className="grid place-items-center w-11 h-11 rounded-full bg-brand-50 text-brand-700 font-semibold shrink-0">
              {t.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                {t.name}
                {t.active ? (
                  <Badge tone="green">พักอยู่</Badge>
                ) : (
                  <Badge tone="slate">ย้ายออก</Badge>
                )}
              </div>
              <div className="text-sm text-slate-400 truncate">
                ห้อง {t.roomNumber}
                {t.phone ? ` · ${t.phone}` : ""}
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-slate-400">สัญญาถึง</div>
              <div className="text-slate-600">{thaiDate(t.contractEnd)}</div>
            </div>
          </button>
        ))}
      </div>

      {/* เพิ่ม */}
      <Modal open={adding} onClose={() => setAdding(false)} title="เพิ่มผู้เช่า">
        <form
          action={async (fd) => {
            await createTenant(fd);
            setAdding(false);
          }}
          className="space-y-4"
        >
          <TenantFields rooms={rooms} />
          <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
            บันทึก
          </button>
        </form>
      </Modal>

      {/* แก้ไข */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`แก้ไข ${editing?.name ?? ""}`}
      >
        {editing && (
          <form
            action={async (fd) => {
              await updateTenant(fd);
              setEditing(null);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={editing.id} />
            <TenantFields rooms={rooms} tenant={editing} />
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
                บันทึก
              </button>
              {editing.active && (
                <button
                  type="button"
                  formAction={async (fd) => {
                    await moveOut(fd);
                    setEditing(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-amber-700 hover:bg-amber-50 font-medium transition"
                >
                  แจ้งย้ายออก
                </button>
              )}
              <button
                type="button"
                formAction={async (fd) => {
                  await deleteTenant(fd);
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

function TenantFields({
  rooms,
  tenant,
}: {
  rooms: RoomOption[];
  tenant?: TenantRow;
}) {
  return (
    <>
      <Input label="ชื่อ-นามสกุล" name="name" defaultValue={tenant?.name} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="เบอร์โทร" name="phone" defaultValue={tenant?.phone ?? ""} />
        <Input
          label="เลขบัตรประชาชน"
          name="idCard"
          defaultValue={tenant?.idCard ?? ""}
        />
      </div>
      <Input
        label="ทะเบียนรถ"
        name="vehiclePlate"
        defaultValue={tenant?.vehiclePlate ?? ""}
      />
      <Select label="ห้อง" name="roomId" defaultValue={tenant?.roomId} required>
        <option value="">— เลือกห้อง —</option>
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>
            ห้อง {r.number}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="วันเข้าพัก"
          name="moveInDate"
          type="date"
          defaultValue={toInput(tenant?.moveInDate ?? null)}
        />
        <Input
          label="เงินมัดจำ (บาท)"
          name="deposit"
          type="number"
          min={0}
          defaultValue={tenant?.deposit ?? 0}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="สัญญาเริ่ม"
          name="contractStart"
          type="date"
          defaultValue={toInput(tenant?.contractStart ?? null)}
        />
        <Input
          label="สัญญาสิ้นสุด"
          name="contractEnd"
          type="date"
          defaultValue={toInput(tenant?.contractEnd ?? null)}
        />
      </div>
      {tenant && (
        <p className="text-xs text-slate-400">
          มัดจำปัจจุบัน: {baht(tenant.deposit)}
        </p>
      )}
    </>
  );
}
