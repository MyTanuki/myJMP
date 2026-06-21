"use client";

import { useState } from "react";
import Link from "next/link";
import Modal, { Input, Select } from "@/components/Modal";
import DatePicker from "@/components/DatePicker";
import { Badge } from "@/components/ui";
import { baht, thaiDate, thaiMonth, calcInvoice } from "@/lib/format";
import {
  updateContract,
  toggleDepositPaid,
  saveMoveInItems,
  moveOutTenant,
} from "./actions";
import { togglePaid } from "@/app/(app)/invoices/actions";
import { deleteTenant } from "@/app/(app)/tenants/actions";

export type RoomDetailData = {
  id: string;
  building: string;
  number: string;
  name: string | null;
  floor: number;
  type: string;
  basePrice: number;
  dormName: string;
  tenant: {
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
    depositPaid: boolean;
    moveInDate: string;
    moveInWater: number | null;
    moveInElec: number | null;
    contractNote: string | null;
    contractStart: string | null;
    contractEnd: string | null;
    moveInItems: { label: string; amount: number }[];
  } | null;
  invoices: {
    id: string;
    period: string;
    status: string;
    dueDate: string | null;
    overdue: boolean;
    daysLate: number;
    lateFee: number;
    rent: number;
    prevWater: number;
    currWater: number;
    waterRate: number;
    prevElec: number;
    currElec: number;
    elecRate: number;
    other: number;
    otherNote: string | null;
    items: { label: string; amount: number }[];
    total: number;
  }[];
  assets: {
    id: string;
    name: string;
    category: string | null;
    quantity: number;
    condition: string;
  }[];
  issues: {
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }[];
  bookings: {
    id: string;
    name: string;
    phone: string | null;
    status: string;
    date: string;
    deposit: number;
  }[];
  tenantOptions: {
    id: string;
    name: string;
    phone: string | null;
    idCard: string | null;
    address: string | null;
    subdistrict: string | null;
    district: string | null;
    province: string | null;
    postalCode: string | null;
  }[];
};

const TABS = [
  { key: "tenant", label: "ผู้เช่า", icon: "👤" },
  { key: "lease", label: "สัญญาเช่า", icon: "📄" },
  { key: "payment", label: "ชำระเงิน", icon: "💵" },
  { key: "assets", label: "รายการทรัพย์สิน", icon: "📦" },
  { key: "moveout", label: "ย้ายออก", icon: "🚪" },
  { key: "issues", label: "การแจ้ง", icon: "🔔" },
  { key: "bookings", label: "จองห้อง", icon: "📅" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function monthsBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const s = new Date(a);
  const e = new Date(b);
  return Math.max(
    0,
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  );
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

export default function RoomDetail({ data }: { data: RoomDetailData }) {
  const [tab, setTab] = useState<TabKey>("tenant");
  const title = `ห้อง ${data.number}${data.name ? ` ${data.name}` : ""}`;

  return (
    <>
      {/* แถบหัว */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <p className="text-sm text-slate-400">
            อาคาร {data.building} · ชั้น {data.floor} · {data.type}
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100"
        >
          ✕ ปิด
        </Link>
      </div>

      {/* แท็บ */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              tab === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tenant" && <TenantTab data={data} />}
      {tab === "lease" && <LeaseTab data={data} />}
      {tab === "payment" && <PaymentTab data={data} />}
      {tab === "assets" && <AssetsTab data={data} />}
      {tab === "moveout" && <MoveOutTab data={data} />}
      {tab === "issues" && <IssuesTab data={data} />}
      {tab === "bookings" && <BookingsTab data={data} />}
    </>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={i} className="border-b border-slate-50 last:border-0">
            <td className="py-2 text-slate-400 w-48 align-top">{k}</td>
            <td className="py-2 text-slate-700">{v || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------- ผู้เช่า ---------- */
function TenantTab({ data }: { data: RoomDetailData }) {
  const t = data.tenant;
  if (!t)
    return (
      <Section title="ผู้เช่า">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">👤</div>
          <p className="text-slate-400 text-sm mb-4">ยังไม่มีผู้เช่าในห้องนี้</p>
          <Link
            href={`/tenants?assign=${data.id}`}
            className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-xl transition"
          >
            + เพิ่มข้อมูลผู้เช่า
          </Link>
        </div>
      </Section>
    );
  return (
    <Section title="ผู้เช่า">
      <div className="rounded-2xl border border-slate-100 p-4 flex flex-wrap items-start gap-4">
        <div className="grid place-items-center w-16 h-16 rounded-full bg-slate-100 text-slate-500 text-2xl font-semibold shrink-0">
          {t.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-800 text-lg">{t.name}</div>
          {t.phone && (
            <div className="text-sm text-slate-500 mt-0.5">📞 {t.phone}</div>
          )}
          <div className="text-sm text-slate-400 mt-0.5">
            {[t.idCard && `บัตร ${t.idCard}`, t.vehiclePlate && `รถ ${t.vehiclePlate}`]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <Link
            href={`/tenants?room=${data.id}`}
            className="inline-block mt-2 text-sm text-brand-700 hover:underline"
          >
            🔍 ดูข้อมูลผู้เช่า
          </Link>
        </div>
        <div className="flex gap-2 shrink-0">
          <form
            action={async (fd) => {
              if (!confirm(`ลบผู้เช่า “${t.name}”?\nข้อมูลทั้งหมดจะถูกลบถาวร`)) return;
              await deleteTenant(fd);
            }}
          >
            <input type="hidden" name="id" value={t.id} />
            <button className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition">
              ลบผู้เช่า
            </button>
          </form>
          <Link
            href={`/tenants?assign=${data.id}`}
            className="px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 text-sm font-medium transition"
          >
            เปลี่ยน/ย้ายผู้เช่า
          </Link>
        </div>
      </div>
    </Section>
  );
}

/* ---------- สัญญาเช่า ---------- */
function LeaseTab({ data }: { data: RoomDetailData }) {
  const t = data.tenant;
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState(t?.moveInItems ?? []);
  const [savedItems, setSavedItems] = useState(false);

  if (!t)
    return (
      <Section title="สัญญาเช่า">
        <p className="text-slate-400 text-sm">
          ยังไม่มีผู้เช่า จึงยังไม่มีข้อมูลสัญญา
        </p>
      </Section>
    );

  const duration = monthsBetween(t.contractStart, t.contractEnd);
  const moveInTotal = items.reduce((s, it) => s + (it.amount || 0), 0);

  const addItem = () => setItems((xs) => [...xs, { label: "", amount: 0 }]);
  const removeItem = (i: number) =>
    setItems((xs) => xs.filter((_, idx) => idx !== i));
  const patchItem = (i: number, p: Partial<{ label: string; amount: number }>) =>
    setItems((xs) => xs.map((it, idx) => (idx === i ? { ...it, ...p } : it)));

  return (
    <>
      {/* ข้อมูลสัญญา */}
      <Section
        title="📄 ข้อมูลสัญญา"
        right={
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            แก้ไขข้อมูลสัญญา
          </button>
        }
      >
        <Rows
          rows={[
            ["ชื่อผู้เข้าพัก", t.name],
            ["ที่อยู่ผู้เข้าพัก", t.address],
            ["วันที่ทำสัญญา", thaiDate(t.contractStart)],
            ["ระยะเวลาสัญญา", duration != null ? `${duration} เดือน` : "—"],
            ["วันที่สิ้นสุดสัญญา", thaiDate(t.contractEnd)],
            ["เลขมิเตอร์น้ำประปา (เข้าพัก)", t.moveInWater ?? "—"],
            ["เลขมิเตอร์ไฟฟ้า (เข้าพัก)", t.moveInElec ?? "—"],
            ["หมายเหตุ", t.contractNote],
          ]}
        />
      </Section>

      {/* เงินประกัน */}
      <Section
        title="🪙 ข้อมูลเงินประกันห้อง"
        right={
          t.depositPaid ? (
            <Badge tone="green">ชำระสำเร็จ</Badge>
          ) : (
            <Badge tone="amber">ค้างชำระ</Badge>
          )
        }
      >
        <table className="w-full text-sm mb-3">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 text-left">
              <th className="py-2 font-medium">รายการ</th>
              <th className="py-2 font-medium text-right">จำนวนเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-50">
              <td className="py-2 text-slate-700">เงินประกันห้อง</td>
              <td className="py-2 text-right text-slate-700">{baht(t.deposit)}</td>
            </tr>
            <tr>
              <td className="py-2 font-semibold text-slate-800">รวมทั้งหมด</td>
              <td className="py-2 text-right font-semibold text-slate-800">
                {baht(t.deposit)}
              </td>
            </tr>
          </tbody>
        </table>
        <form action={toggleDepositPaid}>
          <input type="hidden" name="tenantId" value={t.id} />
          <input type="hidden" name="roomId" value={data.id} />
          <input
            type="hidden"
            name="paid"
            value={(!t.depositPaid).toString()}
          />
          <button
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              t.depositPaid
                ? "text-amber-700 hover:bg-amber-50"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {t.depositPaid ? "ยกเลิกการชำระ" : "ทำเครื่องหมายชำระแล้ว"}
          </button>
        </form>
      </Section>

      {/* ใบเสร็จแรกเข้า */}
      <Section title="🧾 ใบเสร็จแรกเข้า">
        <div className="rounded-xl border border-slate-100 p-4 mb-3 text-sm">
          <div className="text-slate-400 mb-1">รายละเอียดหัวบิล</div>
          <div className="text-slate-700">{t.name}</div>
          {t.address && <div className="text-slate-500">{t.address}</div>}
        </div>

        <form
          action={async (fd) => {
            await saveMoveInItems(fd);
            setSavedItems(true);
            setTimeout(() => setSavedItems(false), 2000);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="tenantId" value={t.id} />
          <input type="hidden" name="roomId" value={data.id} />
          <input type="hidden" name="items" value={JSON.stringify(items)} />

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-left">
                <th className="py-2 font-medium">รายการ</th>
                <th className="py-2 font-medium text-right w-32">จำนวนเงิน</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-1.5">
                    <input
                      value={it.label}
                      onChange={(e) => patchItem(i, { label: e.target.value })}
                      placeholder="เช่น ค่าเช่าเดือนแรก, ส่วนลด"
                      className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-brand-500"
                    />
                  </td>
                  <td className="py-1.5">
                    <input
                      type="number"
                      value={it.amount}
                      onChange={(e) =>
                        patchItem(i, { amount: Number(e.target.value) || 0 })
                      }
                      className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-brand-500"
                    />
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-red-400 hover:text-red-600"
                      aria-label="ลบ"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-semibold text-slate-800">รวมทั้งหมด</td>
                <td className="py-2 text-right font-semibold text-slate-800">
                  {baht(moveInTotal)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addItem}
              className="text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              + เพิ่มรายการ
            </button>
            <span className="text-xs text-slate-400">(ส่วนลดใส่ค่าติดลบ)</span>
            <div className="flex-1" />
            {savedItems && (
              <span className="text-sm text-emerald-600">บันทึกแล้ว</span>
            )}
            <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
              บันทึกใบเสร็จ
            </button>
          </div>
        </form>
      </Section>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="แก้ไขข้อมูลสัญญา"
      >
        <ContractForm
          t={t}
          tenants={data.tenantOptions}
          roomId={data.id}
          onDone={() => setEditing(false)}
        />
      </Modal>
    </>
  );
}

// ประกอบที่อยู่เต็มจากรายละเอียดผู้เช่า (บ้านเลขที่ + ต. + อ. + จ. + รหัสไปรษณีย์)
function fullAddress(p: {
  address: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  postalCode: string | null;
}) {
  return [
    p.address,
    p.subdistrict && `ต.${p.subdistrict}`,
    p.district && `อ.${p.district}`,
    p.province && `จ.${p.province}`,
    p.postalCode,
  ]
    .filter(Boolean)
    .join(" ");
}

function ContractForm({
  t,
  tenants,
  roomId,
  onDone,
}: {
  t: NonNullable<RoomDetailData["tenant"]>;
  tenants: RoomDetailData["tenantOptions"];
  roomId: string;
  onDone: () => void;
}) {
  const [name, setName] = useState(t.name);
  const [phone, setPhone] = useState(t.phone ?? "");
  const [idCard, setIdCard] = useState(t.idCard ?? "");
  const [addr, setAddr] = useState(() => fullAddress(t));

  // ข้อมูลสัญญา (ย้ายมาจากฟอร์มเพิ่มผู้เช่า) — วันเข้าพัก → สัญญาเริ่ม/สิ้นสุด อัตโนมัติ
  const seedMoveIn = t.moveInDate.slice(0, 10);
  const [moveIn, setMoveIn] = useState(seedMoveIn);
  const [months, setMonths] = useState(
    monthsBetween(t.contractStart, t.contractEnd) ?? 6
  );
  const [start, setStart] = useState(
    t.contractStart ? t.contractStart.slice(0, 10) : seedMoveIn
  );
  const [end, setEnd] = useState(
    t.contractEnd ? t.contractEnd.slice(0, 10) : addMonths(seedMoveIn, 6)
  );
  const [deposit, setDeposit] = useState(t.deposit);

  const onMoveIn = (v: string) => {
    setMoveIn(v);
    setStart(v);
    setEnd(addMonths(v, months));
  };
  const onMonths = (n: number) => {
    setMonths(n);
    setEnd(addMonths(start || moveIn, n));
  };
  const onStart = (v: string) => {
    setStart(v);
    setEnd(addMonths(v, months));
  };

  // เลือกผู้เช่าจากรายชื่อที่กรอกไว้ → เติมข้อมูลให้อัตโนมัติ (ไม่ต้องกรอกซ้ำ)
  const fill = (id: string) => {
    const sel = tenants.find((x) => x.id === id);
    if (!sel) return;
    setName(sel.name);
    setPhone(sel.phone ?? "");
    setIdCard(sel.idCard ?? "");
    setAddr(fullAddress(sel));
  };

  return (
    <form
      action={async (fd) => {
        await updateContract(fd);
        onDone();
      }}
      className="space-y-4"
    >
      <input type="hidden" name="tenantId" value={t.id} />
      <input type="hidden" name="roomId" value={roomId} />

      <Select
        label="เลือกข้อมูลจากผู้เช่า"
        defaultValue=""
        onChange={(e) => fill(e.target.value)}
      >
        <option value="">— เลือกข้อมูลจากผู้เช่า —</option>
        {tenants.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
            {x.phone ? ` · ${x.phone}` : ""}
          </option>
        ))}
      </Select>

      <Input
        label="ชื่อผู้เข้าพัก"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="เบอร์โทรผู้เข้าพัก"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          label="หมายเลขบัตรประชาชน"
          name="idCard"
          value={idCard}
          onChange={(e) => setIdCard(e.target.value)}
        />
      </div>
      <label className="block">
        <span className="text-sm font-medium text-slate-600">
          ที่อยู่ผู้เข้าพัก
        </span>
        <div className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700 min-h-11">
          {addr || "—"}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          ดึงจากรายละเอียดผู้เช่า · แก้ไขที่อยู่ได้ที่หน้าผู้เช่า
        </p>
      </label>
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
        <DatePicker label="วันที่ทำสัญญา" name="contractStart" value={start} onChange={onStart} />
        <DatePicker label="วันที่สิ้นสุดสัญญา" name="contractEnd" value={end} onChange={setEnd} />
      </div>
      <Input
        label="เงินมัดจำ (บาท)"
        name="deposit"
        type="number"
        min={0}
        value={deposit}
        onChange={(e) => setDeposit(Number(e.target.value) || 0)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="เลขมิเตอร์น้ำ (เข้าพัก)"
          name="moveInWater"
          type="number"
          defaultValue={t.moveInWater ?? ""}
        />
        <Input
          label="เลขมิเตอร์ไฟ (เข้าพัก)"
          name="moveInElec"
          type="number"
          defaultValue={t.moveInElec ?? ""}
        />
      </div>
      <Input
        label="หมายเหตุ"
        name="contractNote"
        defaultValue={t.contractNote ?? ""}
      />
      <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
        บันทึก
      </button>
    </form>
  );
}

/* ---------- ชำระเงิน ---------- */
function PaymentTab({ data }: { data: RoomDetailData }) {
  const invoices = data.invoices;
  const [sel, setSel] = useState(invoices[0]?.id ?? "");

  if (invoices.length === 0)
    return (
      <Section title="ชำระเงิน">
        <p className="text-slate-400 text-sm">
          ยังไม่มีบิลสำหรับห้องนี้ —{" "}
          <Link
            href={`/invoices?room=${data.id}`}
            className="text-brand-700 hover:underline"
          >
            ไปหน้าออกบิล
          </Link>
        </p>
      </Section>
    );

  const inv = invoices.find((i) => i.id === sel) ?? invoices[0];
  const c = calcInvoice(inv);
  const t = data.tenant;

  const lines: { label: string; amount: number }[] = [
    { label: `ค่าเช่าห้อง เดือน ${thaiMonth(inv.period)}`, amount: c.rent },
    {
      label: `ค่าน้ำ (${inv.currWater} − ${inv.prevWater} = ${c.waterUnits} หน่วย)`,
      amount: c.waterCost,
    },
    {
      label: `ค่าไฟ (${inv.currElec} − ${inv.prevElec} = ${c.elecUnits} หน่วย)`,
      amount: c.elecCost,
    },
    ...inv.items.map((it) => ({ label: it.label, amount: it.amount })),
    ...(inv.other
      ? [{ label: inv.otherNote || "อื่นๆ", amount: inv.other }]
      : []),
    ...(inv.overdue && inv.lateFee > 0
      ? [{ label: `ค่าปรับล่าช้า ${inv.daysLate} วัน`, amount: inv.lateFee }]
      : []),
  ];

  return (
    <Section title="ชำระเงิน">
      <label className="block mb-4">
        <span className="text-sm text-slate-500">เลือกบิลย้อนหลัง</span>
        <select
          value={sel}
          onChange={(e) => setSel(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white outline-none focus:border-brand-500"
        >
          {invoices.map((i) => (
            <option key={i.id} value={i.id}>
              {thaiMonth(i.period)}{" "}
              {i.status === "paid"
                ? "(ชำระแล้ว)"
                : i.overdue
                  ? "(เกินกำหนด)"
                  : "(ค้างชำระ)"}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <span className="font-semibold text-slate-800">
            บิลค่าเช่า · {thaiMonth(inv.period)}
          </span>
          {inv.status === "paid" ? (
            <Badge tone="green">ชำระแล้ว</Badge>
          ) : inv.overdue ? (
            <Badge tone="red">เกินกำหนด</Badge>
          ) : (
            <Badge tone="amber">ค้างชำระ</Badge>
          )}
        </div>
        <div className="p-4">
          {t && (
            <div className="text-sm text-slate-500 mb-3">
              <div className="text-slate-700 font-medium">{t.name}</div>
              {t.address && <div>{t.address}</div>}
              {t.phone && <div>{t.phone}</div>}
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-left">
                <th className="py-2 font-medium">รายการ</th>
                <th className="py-2 font-medium text-right">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2 text-slate-700">{l.label}</td>
                  <td
                    className={`py-2 text-right ${l.amount < 0 ? "text-red-500" : "text-slate-700"}`}
                  >
                    {baht(l.amount)}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2.5 font-semibold text-slate-800">รวมทั้งหมด</td>
                <td className="py-2.5 text-right font-bold text-brand-700">
                  {baht(inv.total)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Link
              href={`/invoices/${inv.id}/print`}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition"
            >
              พิมพ์
            </Link>
            <Link
              href={`/invoices?room=${data.id}&period=${inv.period}`}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition"
            >
              แก้ไขบิล
            </Link>
            <div className="flex-1" />
            <form action={togglePaid}>
              <input type="hidden" name="id" value={inv.id} />
              <input
                type="hidden"
                name="status"
                value={inv.status === "paid" ? "unpaid" : "paid"}
              />
              <button
                className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                  inv.status === "paid"
                    ? "border border-amber-200 text-amber-700 hover:bg-amber-50"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {inv.status === "paid" ? "ยกเลิกการชำระ" : "จ่ายค่าห้อง"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- ทรัพย์สิน ---------- */
function AssetsTab({ data }: { data: RoomDetailData }) {
  return (
    <Section
      title="รายการทรัพย์สินในห้อง"
      right={
        <Link href={`/inventory?room=${data.id}`} className="text-sm text-brand-700 hover:underline">
          จัดการทรัพย์สิน
        </Link>
      }
    >
      {data.assets.length === 0 ? (
        <p className="text-slate-400 text-sm">ยังไม่มีทรัพย์สินผูกกับห้องนี้</p>
      ) : (
        <div className="space-y-2">
          {data.assets.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between border-b border-slate-50 last:border-0 py-2 text-sm"
            >
              <span className="text-slate-700">
                {a.name}
                <span className="text-slate-400"> × {a.quantity}</span>
              </span>
              <span className="text-slate-400">{a.category ?? ""}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---------- ย้ายออก ---------- */
function MoveOutTab({ data }: { data: RoomDetailData }) {
  const t = data.tenant;
  if (!t)
    return (
      <Section title="ย้ายออก">
        <p className="text-slate-400 text-sm">ห้องนี้ว่างอยู่แล้ว</p>
      </Section>
    );
  return (
    <Section title="แจ้งย้ายออก">
      <p className="text-sm text-slate-500 mb-4">
        ทำเครื่องหมายว่า <b>{t.name}</b> ย้ายออกจากห้อง {data.number} — ห้องจะกลับเป็นสถานะว่าง
        (ประวัติบิลและสัญญายังถูกเก็บไว้)
      </p>
      <form
        action={async (fd) => {
          if (!confirm("ยืนยันแจ้งย้ายออก?")) return;
          await moveOutTenant(fd);
        }}
      >
        <input type="hidden" name="tenantId" value={t.id} />
        <input type="hidden" name="roomId" value={data.id} />
        <button className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-xl transition">
          แจ้งย้ายออก
        </button>
      </form>
    </Section>
  );
}

/* ---------- การแจ้ง ---------- */
function IssuesTab({ data }: { data: RoomDetailData }) {
  const STATUS: Record<string, string> = {
    open: "รอดำเนินการ",
    in_progress: "กำลังซ่อม",
    done: "เสร็จแล้ว",
  };
  return (
    <Section
      title="การแจ้งซ่อม / ปัญหา"
      right={
        <Link href={`/issues?room=${data.id}`} className="text-sm text-brand-700 hover:underline">
          จัดการแจ้งซ่อม
        </Link>
      }
    >
      {data.issues.length === 0 ? (
        <p className="text-slate-400 text-sm">ไม่มีรายการแจ้ง</p>
      ) : (
        <div className="space-y-2">
          {data.issues.map((i) => (
            <div
              key={i.id}
              className="flex items-center justify-between border-b border-slate-50 last:border-0 py-2 text-sm"
            >
              <span className="text-slate-700">{i.title}</span>
              <span className="flex items-center gap-3">
                <span className="text-slate-400">{thaiDate(i.createdAt)}</span>
                <Badge tone={i.status === "done" ? "green" : "amber"}>
                  {STATUS[i.status] ?? i.status}
                </Badge>
              </span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---------- จองห้อง ---------- */
function BookingsTab({ data }: { data: RoomDetailData }) {
  const STATUS: Record<string, { label: string; tone: string }> = {
    pending: { label: "รอยืนยัน", tone: "amber" },
    confirmed: { label: "ยืนยันแล้ว", tone: "green" },
    cancelled: { label: "ยกเลิก", tone: "slate" },
  };
  return (
    <Section
      title="การจองห้องนี้"
      right={
        <Link href={`/bookings?room=${data.id}`} className="text-sm text-brand-700 hover:underline">
          จัดการการจอง
        </Link>
      }
    >
      {data.bookings.length === 0 ? (
        <p className="text-slate-400 text-sm">ยังไม่มีการจอง</p>
      ) : (
        <div className="space-y-2">
          {data.bookings.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between border-b border-slate-50 last:border-0 py-2 text-sm"
            >
              <span className="text-slate-700">
                {b.name}
                {b.phone ? (
                  <span className="text-slate-400"> · {b.phone}</span>
                ) : null}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-slate-400">{thaiDate(b.date)}</span>
                <Badge tone={STATUS[b.status]?.tone ?? "slate"}>
                  {STATUS[b.status]?.label ?? b.status}
                </Badge>
              </span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
