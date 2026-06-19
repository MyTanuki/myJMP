"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchAddressByDistrict, type ThaiAddress } from "thai-address-database";
import Modal, { Input, Select } from "@/components/Modal";
import DatePicker from "@/components/DatePicker";
import { Badge } from "@/components/ui";
import { baht, thaiDate } from "@/lib/format";
import {
  createTenant,
  updateTenant,
  moveOut,
  deleteTenant,
  assignTenantToRoom,
} from "./actions";

export type TenantRow = {
  id: string;
  name: string;
  phone: string | null;
  idCard: string | null;
  vehiclePlate: string | null;
  address: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  postalCode: string | null;
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

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// บวกจำนวนเดือน (clamp วันให้อยู่ในเดือนปลายทาง เช่น 31 ม.ค. + 1 เดือน = 28/29 ก.พ.)
function addMonths(iso: string, months: number): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const base = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const day = Math.min(d, lastDay);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthsBetween(a: string, b: string): number {
  if (!a || !b) return 6;
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  let m = (by - ay) * 12 + (bm - am);
  if (bd < ad) m -= 1;
  return m > 0 ? m : 6;
}

export default function TenantsClient({
  tenants,
  rooms,
  assignRoom,
}: {
  tenants: TenantRow[];
  rooms: RoomOption[];
  assignRoom?: { id: string; label: string };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<TenantRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const list = tenants.filter((t) => (showInactive ? true : t.active));

  const handleAssign = async (t: TenantRow) => {
    if (!assignRoom) return;
    if (!confirm(`ย้าย ${t.name} เข้าห้อง ${assignRoom.label}?`)) return;
    await assignTenantToRoom(t.id, assignRoom.id);
    router.push(`/rooms/${assignRoom.id}`);
  };

  return (
    <>
      {assignRoom && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
          <span className="text-brand-800">
            เลือกผู้เช่าเข้า <b>ห้อง {assignRoom.label}</b> — คลิกชื่อเพื่อย้ายเข้าห้องนี้ หรือกด “เพิ่มผู้เช่า”
          </span>
          <Link
            href={`/rooms/${assignRoom.id}`}
            className="text-slate-500 hover:text-slate-700 whitespace-nowrap"
          >
            ยกเลิก
          </Link>
        </div>
      )}
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
            onClick={() => (assignRoom ? handleAssign(t) : setEditing(t))}
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
            if (assignRoom) router.push(`/rooms/${assignRoom.id}`);
          }}
          className="space-y-4"
        >
          <TenantFields rooms={rooms} lockRoom={assignRoom} />
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
                  if (!confirm("ลบผู้เช่ารายนี้?\nข้อมูลทั้งหมดจะถูกลบถาวร")) return;
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
  lockRoom,
}: {
  rooms: RoomOption[];
  tenant?: TenantRow;
  lockRoom?: { id: string; label: string };
}) {
  const seedMoveIn = tenant ? toInput(tenant.moveInDate) : todayIso();
  const seedStart = tenant?.contractStart ? toInput(tenant.contractStart) : seedMoveIn;
  const seedEnd = tenant?.contractEnd
    ? toInput(tenant.contractEnd)
    : addMonths(seedMoveIn, 6);

  const [moveIn, setMoveIn] = useState(seedMoveIn);
  const [months, setMonths] = useState(
    tenant?.contractStart && tenant?.contractEnd
      ? monthsBetween(toInput(tenant.contractStart), toInput(tenant.contractEnd))
      : 6
  );
  const [start, setStart] = useState(seedStart);
  const [end, setEnd] = useState(seedEnd);

  const onMoveIn = (v: string) => {
    setMoveIn(v);
    setStart(v); // สัญญาเริ่มตามวันเข้าพัก
    setEnd(addMonths(v, months)); // สัญญาสิ้นสุด = วันเข้าพัก + ระยะสัญญา
  };
  const onMonths = (n: number) => {
    setMonths(n);
    setEnd(addMonths(start || moveIn, n));
  };
  const onStart = (v: string) => {
    setStart(v);
    setEnd(addMonths(v, months));
  };

  // ที่อยู่ + autocomplete จากตำบล
  const [address, setAddress] = useState(tenant?.address ?? "");
  const [subdistrict, setSubdistrict] = useState(tenant?.subdistrict ?? "");
  const [district, setDistrict] = useState(tenant?.district ?? "");
  const [province, setProvince] = useState(tenant?.province ?? "");
  const [postalCode, setPostalCode] = useState(tenant?.postalCode ?? "");
  const [sugs, setSugs] = useState<ThaiAddress[]>([]);

  const onSubdistrict = (v: string) => {
    setSubdistrict(v);
    if (v.trim().length >= 2) {
      setSugs(searchAddressByDistrict(v.trim()).slice(0, 8));
    } else {
      setSugs([]);
    }
  };
  const pickAddr = (a: ThaiAddress) => {
    setSubdistrict(a.district);
    setDistrict(a.amphoe);
    setProvince(a.province);
    setPostalCode(a.zipcode);
    setSugs([]);
  };

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
      {lockRoom ? (
        <div>
          <span className="text-sm font-medium text-slate-600">ห้อง</span>
          <div className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700">
            ห้อง {lockRoom.label}
          </div>
          <input type="hidden" name="roomId" value={lockRoom.id} />
        </div>
      ) : (
        <Select label="ห้อง" name="roomId" defaultValue={tenant?.roomId} required>
          <option value="">— เลือกห้อง —</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              ห้อง {r.number}
            </option>
          ))}
        </Select>
      )}

      {/* ที่อยู่ */}
      <div className="rounded-xl bg-slate-50 p-3 space-y-3">
        <div className="text-sm font-medium text-slate-600">ที่อยู่ตามทะเบียนบ้าน</div>
        <Input
          label="ที่อยู่ (บ้านเลขที่ หมู่ ถนน)"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div className="relative">
          <Input
            label="ตำบล/แขวง"
            name="subdistrict"
            value={subdistrict}
            onChange={(e) => onSubdistrict(e.target.value)}
            autoComplete="off"
            placeholder="พิมพ์ตำบลเพื่อค้นหา…"
          />
          {sugs.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg text-sm">
              {sugs.map((a, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => pickAddr(a)}
                  className="block w-full text-left px-3 py-2 hover:bg-brand-50"
                >
                  <span className="text-slate-700">{a.district}</span>
                  <span className="text-slate-400">
                    {" » "}{a.amphoe} » {a.province} » {a.zipcode}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="อำเภอ/เขต"
            name="district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
          <Input
            label="จังหวัด"
            name="province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          />
        </div>
        <Input
          label="รหัสไปรษณีย์"
          name="postalCode"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DatePicker label="วันเข้าพัก" name="moveInDate" value={moveIn} onChange={onMoveIn} />
        <Input
          label="ระยะสัญญา (เดือน)"
          name="contractMonths"
          type="number"
          min={1}
          value={months}
          onChange={(e) => onMonths(Number(e.target.value) || 0)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DatePicker label="สัญญาเริ่ม" name="contractStart" value={start} onChange={onStart} />
        <DatePicker label="สัญญาสิ้นสุด" name="contractEnd" value={end} onChange={setEnd} />
      </div>
      <Input
        label="เงินมัดจำ (บาท)"
        name="deposit"
        type="number"
        min={0}
        defaultValue={tenant?.deposit ?? 0}
      />
      {tenant && (
        <p className="text-xs text-slate-400">
          มัดจำปัจจุบัน: {baht(tenant.deposit)}
        </p>
      )}
    </>
  );
}
