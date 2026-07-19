"use client";

import { useState } from "react";
import Modal, { Input } from "@/components/Modal";
import DatePicker from "@/components/DatePicker";
import SaveButton from "@/components/SaveButton";
import { Badge } from "@/components/ui";
import { baht, calcInvoice, meterUnits, overdueInfo, roomLabel, thaiDate, thaiMonth } from "@/lib/format";
import {
  createInvoice,
  createMonthlyInvoices,
  togglePaid,
  deleteInvoice,
} from "./actions";

export type InvoiceData = {
  id: string;
  rent: number;
  prevWater: number;
  currWater: number;
  prevElec: number;
  currElec: number;
  waterRate: number;
  elecRate: number;
  other: number;
  otherNote: string | null;
  waterMeterChanged: boolean;
  waterOldEnd: number;
  elecMeterChanged: boolean;
  elecOldEnd: number;
  status: string;
  dueDate: string | null;
  // รายละเอียดการชำระ
  paidDate: string | null;
  paymentMethod: string | null;
  paidAmount: number | null;
  paymentNote: string | null;
  cancelNote: string | null;
  items: { label: string; amount: number }[];
};

export type RoomLine = {
  roomId: string;
  building: string;
  floor: number;
  number: string;
  tenant: string | null;
  // ข้อมูลหัวบิลผู้เช่า (แบบต้นแบบ)
  tenantPhone: string | null;
  tenantIdCard: string | null;
  tenantAddress: string | null;
  basePrice: number;
  waterRate: number; // อัตราที่ใช้จริง (ของห้อง หรือค่ากลาง)
  elecRate: number;
  prevWater: number; // จากเดือนก่อน
  prevElec: number;
  meterWater: number | null; // เลขมิเตอร์ที่จดไว้รอบนี้ (ถ้ามี)
  meterElec: number | null;
  // สถานะมิเตอร์เต็ม/เปลี่ยนมิเตอร์ จากหน้าจดมิเตอร์รอบนี้
  meterWaterChanged: boolean;
  meterWaterOldEnd: number;
  meterElecChanged: boolean;
  meterElecOldEnd: number;
  // รายการบริการจากบิลล่าสุด ใช้ตั้งต้นเมื่อยังไม่มีบิลรอบนี้
  prevItems: { label: string; amount: number }[];
  invoice: InvoiceData | null;
};

export type Preset = { label: string; amount: number };

export default function InvoicesClient({
  period,
  lines,
  presets,
  lateFeePerDay,
  dueDay,
}: {
  period: string;
  lines: RoomLine[];
  presets: Preset[];
  lateFeePerDay: number;
  dueDay: number | null;
}) {
  const [active, setActive] = useState<RoomLine | null>(null);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "unpaid" | "paid" | "nobill"
  >("all");
  const [q, setQ] = useState("");

  const pendingCount = lines.filter((l) => l.tenant && !l.invoice).length;
  const unpaidCount = lines.filter(
    (l) => l.invoice && l.invoice.status !== "paid"
  ).length;
  const paidCount = lines.filter(
    (l) => l.invoice && l.invoice.status === "paid"
  ).length;

  const kw = q.trim().toLowerCase();
  const visible = lines.filter((l) => {
    // ห้องว่างที่ไม่มีบิล ไม่ต้องแสดง (แบบต้นแบบ)
    if (!l.tenant && !l.invoice) return false;
    if (filter === "unpaid" && !(l.invoice && l.invoice.status !== "paid"))
      return false;
    if (filter === "paid" && !(l.invoice && l.invoice.status === "paid"))
      return false;
    if (filter === "nobill" && !(l.tenant && !l.invoice)) return false;
    if (
      kw &&
      !roomLabel(l.building, l.number).toLowerCase().includes(kw) &&
      !(l.tenant ?? "").toLowerCase().includes(kw)
    )
      return false;
    return true;
  });

  // จัดกลุ่มเป็น อาคาร → ชั้น (lines มาเรียงตามอาคาร/ชั้น/ห้องแล้วจากเซิร์ฟเวอร์)
  const buildings = new Map<string, Map<number, RoomLine[]>>();
  for (const line of visible) {
    if (!buildings.has(line.building)) buildings.set(line.building, new Map());
    const floors = buildings.get(line.building)!;
    if (!floors.has(line.floor)) floors.set(line.floor, []);
    floors.get(line.floor)!.push(line);
  }

  // การ์ดกล่องแบบต้นแบบ: สีตามสถานะ แดง=ค้าง เขียว=จ่ายแล้ว เหลือง=ยังไม่ออกบิล
  const renderCard = (line: RoomLine) => {
    const inv = line.invoice;
    const od = inv ? overdueInfo(inv, lateFeePerDay) : null;
    const total = inv ? calcInvoice(inv).total + (od?.lateFee ?? 0) : null;

    const style = !inv
      ? {
          card: "bg-amber-50 border-amber-200 hover:border-amber-300",
          amount: "text-amber-700",
          label: "ยังไม่ออกบิล",
          badge: "text-amber-700",
        }
      : inv.status === "paid"
        ? {
            card: "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
            amount: "text-emerald-700",
            label: "ชำระแล้ว",
            badge: "text-emerald-700",
          }
        : {
            card: "bg-rose-50 border-rose-200 hover:border-rose-300",
            amount: "text-rose-600",
            label: od?.overdue ? `เกินกำหนด ${od.daysLate} วัน` : "ค้างชำระ",
            badge: "text-rose-600",
          };

    return (
      <button
        key={line.roomId}
        onClick={() => setActive(line)}
        className={`text-left rounded-2xl border shadow-sm p-4 transition hover:shadow ${style.card}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-lg font-bold text-slate-800">{line.number}</div>
          {line.tenant && (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 mt-1.5 shrink-0 text-slate-400"
            >
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.58-5-8-5Z" />
            </svg>
          )}
        </div>
        <div className="text-xs text-slate-400 truncate">
          {line.tenant ?? "ว่าง (มีบิลค้าง)"}
        </div>
        <div className={`mt-2 text-lg font-bold ${style.amount}`}>
          {inv ? baht(total!) : "+ ออกบิล"}
        </div>
        <div className={`text-xs font-medium ${style.badge}`}>{style.label}</div>
        {inv && (
          <div className="mt-1 text-[10px] text-slate-400 truncate">
            น้ำ {meterUnits(inv.prevWater, inv.currWater, inv.waterMeterChanged, inv.waterOldEnd)}{" "}
            · ไฟ {meterUnits(inv.prevElec, inv.currElec, inv.elecMeterChanged, inv.elecOldEnd)}{" "}
            หน่วย
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      {/* ออกบิลอัตโนมัติทั้งเดือน — ดึงค่าเช่า มิเตอร์ และรายการบริการเดือนก่อนมาตั้งต้น */}
      <form
        action={async (fd) => {
          const r = await createMonthlyInvoices(fd);
          setBulkMsg(`ออกบิลอัตโนมัติแล้ว ${r?.created ?? 0} ห้อง`);
          setTimeout(() => setBulkMsg(null), 5000);
        }}
        className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4"
      >
        <input type="hidden" name="period" value={period} />
        <div className="min-w-0 flex-1 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">
            ออกบิลอัตโนมัติทั้งเดือน
          </span>{" "}
          — ห้องที่มีผู้เช่าและยังไม่มีบิล {pendingCount} ห้อง
          (ดึงค่าเช่า เลขมิเตอร์ และรายการบริการจากบิลเดือนก่อนให้อัตโนมัติ)
        </div>
        {bulkMsg && (
          <span className="text-sm font-medium text-emerald-600">{bulkMsg}</span>
        )}
        <button
          type="submit"
          disabled={pendingCount === 0}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-xl transition"
        >
          ⚡ ออกบิลทั้งเดือน
        </button>
      </form>

      {/* ค้นหา + ฟิลเตอร์บิลแบบต้นแบบ */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาห้อง / ชื่อผู้เช่า"
          className="w-56 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        {(
          [
            { key: "all", label: `บิลทั้งหมด (${lines.length})` },
            { key: "unpaid", label: `ค้างชำระ (${unpaidCount})` },
            { key: "paid", label: `ชำระแล้ว (${paidCount})` },
            { key: "nobill", label: `ยังไม่ออกบิล (${pendingCount})` },
          ] as const
        ).map((f) => (
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

      <div className="space-y-5">
        {[...buildings.entries()].map(([building, floors]) => (
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
                  <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
                    {list.map(renderCard)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={`บิลห้อง ${active ? roomLabel(active.building, active.number) : ""}`}
      >
        {active && (
          <BillDetail
            key={active.roomId}
            line={active}
            period={period}
            presets={presets}
            lateFeePerDay={lateFeePerDay}
            dueDay={dueDay}
            onDone={() => setActive(null)}
          />
        )}
      </Modal>
    </>
  );
}

// รายละเอียดบิลแบบต้นแบบ: มีบิลแล้ว → หน้าอ่านก่อน กด "แก้ไขบิล" ค่อยเข้าฟอร์ม
function BillDetail(props: {
  line: RoomLine;
  period: string;
  presets: Preset[];
  lateFeePerDay: number;
  dueDay: number | null;
  onDone: () => void;
}) {
  const [editing, setEditing] = useState(false);
  if (!props.line.invoice || editing) {
    return <InvoiceForm {...props} onBack={props.line.invoice ? () => setEditing(false) : undefined} />;
  }
  return <BillView {...props} onEdit={() => setEditing(true)} />;
}

// หน้าอ่านรายละเอียดบิล (layout ตามต้นแบบ)
function BillView({
  line,
  period,
  lateFeePerDay,
  onDone,
  onEdit,
}: {
  line: RoomLine;
  period: string;
  presets: Preset[];
  lateFeePerDay: number;
  dueDay: number | null;
  onDone: () => void;
  onEdit: () => void;
}) {
  const inv = line.invoice!;
  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelNote, setCancelNote] = useState("");

  const c = calcInvoice(inv);
  const od = overdueInfo(inv, lateFeePerDay);
  const grandTotal = c.total + od.lateFee;
  // เลขที่บิลอ้างอิง (สร้างจากงวด+ห้อง แบบต้นแบบ INVyyyymm...)
  const invNo = `INV${period.replace("-", "")}-${line.building}${line.number}`;

  return (
    <div className="space-y-4">
      {/* หัวบิล: เลขที่ + สถานะ */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-slate-400">{invNo}</div>
        {inv.status === "paid" ? (
          <Badge tone="green">บิลค่าเช่า · ชำระแล้ว</Badge>
        ) : od.overdue ? (
          <Badge tone="red">บิลค่าเช่า · เกินกำหนด {od.daysLate} วัน</Badge>
        ) : (
          <Badge tone="amber">บิลค่าเช่า · ค้างชำระ</Badge>
        )}
      </div>

      {/* รายละเอียดหัวบิล (ผู้เช่า) */}
      <div className="rounded-xl bg-slate-50 p-4 text-sm">
        <div className="font-medium text-slate-600 mb-1">รายละเอียดหัวบิล</div>
        <div className="text-slate-800">{line.tenant ?? "— ไม่มีผู้เช่า —"}</div>
        {line.tenantAddress && (
          <div className="text-slate-500 text-xs mt-0.5">
            ที่อยู่ {line.tenantAddress}
          </div>
        )}
        <div className="text-slate-500 text-xs mt-0.5">
          {line.tenantPhone && <>เบอร์โทร {line.tenantPhone} </>}
          {line.tenantIdCard && <>· เลขประจำตัวประชาชน {line.tenantIdCard}</>}
        </div>
        <div className="text-slate-400 text-xs mt-1">
          กำหนดชำระ {inv.dueDate ? thaiDate(inv.dueDate) : "—"}
        </div>
      </div>

      {/* ตารางรายการแบบต้นแบบ (โชว์สูตรมิเตอร์) */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400 text-left">
            <th className="py-2 font-medium">รายการ</th>
            <th className="py-2 font-medium text-right">จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-50">
            <td className="py-2 text-slate-700">
              ค่าเช่าห้อง {roomLabel(line.building, line.number)} เดือน{" "}
              {thaiMonth(inv ? period : period)}
            </td>
            <td className="py-2 text-right text-slate-700">{baht(c.rent)}</td>
          </tr>
          <tr className="border-b border-slate-50">
            <td className="py-2 text-slate-700">
              ค่าน้ำประปา{" "}
              <span className="text-slate-400 text-xs">
                {inv.waterMeterChanged
                  ? `(เปลี่ยนมิเตอร์ เก่าสิ้นสุด ${inv.waterOldEnd} = ${c.waterUnits} หน่วย × ${inv.waterRate})`
                  : `(${inv.currWater} − ${inv.prevWater} = ${c.waterUnits} หน่วย × ${inv.waterRate})`}
              </span>
            </td>
            <td className="py-2 text-right text-slate-700">{baht(c.waterCost)}</td>
          </tr>
          <tr className="border-b border-slate-50">
            <td className="py-2 text-slate-700">
              ค่าไฟฟ้า{" "}
              <span className="text-slate-400 text-xs">
                {inv.elecMeterChanged
                  ? `(เปลี่ยนมิเตอร์ เก่าสิ้นสุด ${inv.elecOldEnd} = ${c.elecUnits} หน่วย × ${inv.elecRate})`
                  : `(${inv.currElec} − ${inv.prevElec} = ${c.elecUnits} หน่วย × ${inv.elecRate})`}
              </span>
            </td>
            <td className="py-2 text-right text-slate-700">{baht(c.elecCost)}</td>
          </tr>
          {inv.items.map((it, i) => (
            <tr key={i} className="border-b border-slate-50">
              <td className="py-2 text-slate-700">{it.label}</td>
              <td
                className={`py-2 text-right ${it.amount < 0 ? "text-emerald-600" : "text-slate-700"}`}
              >
                {baht(it.amount)}
              </td>
            </tr>
          ))}
          {od.overdue && od.lateFee > 0 && (
            <tr className="border-b border-slate-50">
              <td className="py-2 text-red-600">
                ค่าปรับล่าช้า {od.daysLate} วัน
              </td>
              <td className="py-2 text-right text-red-600">{baht(od.lateFee)}</td>
            </tr>
          )}
          <tr>
            <td className="py-3 font-semibold text-slate-800">รวมทั้งหมด</td>
            <td className="py-3 text-right text-xl font-bold text-brand-700">
              {baht(grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* รายละเอียดการชำระเงิน / รับชำระ */}
      {inv.status === "paid" ? (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm space-y-1">
          <div className="font-medium text-emerald-800">
            ✓ รายละเอียดการชำระเงิน
          </div>
          <div className="text-emerald-700">
            วันที่ {thaiDate(inv.paidDate)} · ช่องทาง{" "}
            {inv.paymentMethod ?? "ไม่ระบุ"} · ยอดรวม{" "}
            {baht(inv.paidAmount ?? grandTotal)}
          </div>
          {inv.paymentNote && (
            <div className="text-emerald-600 text-xs">
              หมายเหตุ: {inv.paymentNote}
            </div>
          )}
          {!cancelOpen ? (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="mt-1 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition"
            >
              ยกเลิกการชำระ
            </button>
          ) : (
            <form
              action={async (fd) => {
                await togglePaid(fd);
                onDone();
              }}
              className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2"
            >
              <input type="hidden" name="id" value={inv.id} />
              <input type="hidden" name="status" value="unpaid" />
              <label className="block text-xs font-medium text-amber-800">
                เหตุผลการยกเลิกชำระ (จำเป็น)
                <input
                  name="cancelNote"
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  placeholder="เช่น บันทึกผิดบิล ยอดไม่ตรง สลิปไม่ผ่าน"
                  className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400"
                />
              </label>
              <div className="flex gap-2">
                <button
                  disabled={!cancelNote.trim()}
                  className="rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 text-xs font-medium text-white transition"
                >
                  ยืนยันยกเลิกชำระ
                </button>
                <button
                  type="button"
                  onClick={() => setCancelOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-white transition"
                >
                  ปิด
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 p-4 text-sm space-y-2">
          {inv.cancelNote && (
            <div className="text-xs text-amber-600">
              ⚠️ เคยยกเลิกการชำระ — เหตุผล: {inv.cancelNote}
            </div>
          )}
          {!payOpen ? (
            <button
              type="button"
              onClick={() => setPayOpen(true)}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition"
            >
              💵 จ่ายค่าห้อง
            </button>
          ) : (
            <form
              action={async (fd) => {
                await togglePaid(fd);
                onDone();
              }}
              className="space-y-2"
            >
              <input type="hidden" name="id" value={inv.id} />
              <input type="hidden" name="status" value="paid" />
              <div className="font-medium text-slate-700">บันทึกการรับชำระ</div>
              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  label="วันที่ชำระ"
                  name="paidDate"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
                <label className="block">
                  <span className="text-sm font-medium text-slate-600">
                    ช่องทางชำระ
                  </span>
                  <select
                    name="paymentMethod"
                    defaultValue="เงินสด"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 bg-white"
                  >
                    <option>เงินสด</option>
                    <option>โอนเงิน</option>
                    <option>อื่นๆ</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="ยอดที่รับชำระ (บาท)"
                  name="paidAmount"
                  type="number"
                  defaultValue={grandTotal}
                />
                <Input label="หมายเหตุ (ถ้ามี)" name="paymentNote" />
              </div>
              <div className="flex gap-2">
                <button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition">
                  ยืนยันรับชำระ
                </button>
                <button
                  type="button"
                  onClick={() => setPayOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 transition"
                >
                  ปิด
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ปุ่มแบบต้นแบบ: พิมพ์ / แก้ไขบิล */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <a
          href={`/invoices/${inv.id}/print`}
          target="_blank"
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition"
        >
          🖨️ พิมพ์ใบแจ้งหนี้
        </a>
        {inv.status === "paid" && (
          <a
            href={`/invoices/${inv.id}/print?type=receipt`}
            target="_blank"
            className="px-4 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium transition"
          >
            🧾 พิมพ์ใบเสร็จรับเงิน
          </a>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition"
        >
          ✏️ แก้ไขบิล
        </button>
        <div className="flex-1" />
        <form
          action={async (fd) => {
            if (!confirm("ลบบิลนี้?\nเมื่อลบแล้วไม่สามารถย้อนกลับได้")) return;
            await deleteInvoice(fd);
            onDone();
          }}
        >
          <input type="hidden" name="id" value={inv.id} />
          <button className="px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 font-medium transition">
            ลบ
          </button>
        </form>
      </div>
    </div>
  );
}

function InvoiceForm({
  line,
  period,
  presets,
  lateFeePerDay,
  dueDay,
  onDone,
  onBack,
}: {
  line: RoomLine;
  period: string;
  presets: Preset[];
  lateFeePerDay: number;
  dueDay: number | null;
  onDone: () => void;
  onBack?: () => void; // กลับไปหน้าอ่านรายละเอียดบิล
}) {
  const inv = line.invoice;
  const [rent, setRent] = useState(inv?.rent ?? line.basePrice);
  const [prevWater, setPrevWater] = useState(inv?.prevWater ?? line.prevWater);
  const [currWater, setCurrWater] = useState(
    inv?.currWater ?? line.meterWater ?? line.prevWater
  );
  const [prevElec, setPrevElec] = useState(inv?.prevElec ?? line.prevElec);
  const [currElec, setCurrElec] = useState(
    inv?.currElec ?? line.meterElec ?? line.prevElec
  );
  const [wRate] = useState(inv?.waterRate ?? line.waterRate);
  const [eRate] = useState(inv?.elecRate ?? line.elecRate);
  // สถานะเปลี่ยนมิเตอร์: ใช้ของบิลถ้ามี ไม่งั้นดึงจากที่จดมิเตอร์รอบนี้
  const waterChanged = inv?.waterMeterChanged ?? line.meterWaterChanged;
  const waterOldEnd = inv?.waterOldEnd ?? line.meterWaterOldEnd;
  const elecChanged = inv?.elecMeterChanged ?? line.meterElecChanged;
  const elecOldEnd = inv?.elecOldEnd ?? line.meterElecOldEnd;
  // บิลใหม่ → ตั้งต้นด้วยรายการบริการจากบิลเดือนก่อน ไม่ต้องเลือกใหม่ทุกเดือน
  const [items, setItems] = useState<{ label: string; amount: number }[]>(
    inv?.items ?? line.prevItems
  );

  const addItem = () => setItems((xs) => [...xs, { label: "", amount: 0 }]);
  const removeItem = (i: number) =>
    setItems((xs) => xs.filter((_, idx) => idx !== i));
  const patchItem = (i: number, p: Partial<{ label: string; amount: number }>) =>
    setItems((xs) => xs.map((it, idx) => (idx === i ? { ...it, ...p } : it)));

  const c = calcInvoice({
    rent,
    prevWater,
    currWater,
    prevElec,
    currElec,
    waterRate: wRate,
    elecRate: eRate,
    other: 0,
    waterMeterChanged: waterChanged,
    waterOldEnd,
    elecMeterChanged: elecChanged,
    elecOldEnd,
    items,
  });
  const od = inv ? overdueInfo(inv, lateFeePerDay) : null;
  const grandTotal = c.total + (od?.lateFee ?? 0);

  return (
    <form
      action={async (fd) => {
        await createInvoice(fd);
        onDone();
      }}
      className="space-y-4"
    >
      <input type="hidden" name="roomId" value={line.roomId} />
      <input type="hidden" name="period" value={period} />
      <input type="hidden" name="waterRate" value={wRate} />
      <input type="hidden" name="elecRate" value={eRate} />
      <input type="hidden" name="other" value={0} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="waterMeterChanged" value={waterChanged ? "1" : ""} />
      <input type="hidden" name="waterOldEnd" value={waterOldEnd} />
      <input type="hidden" name="elecMeterChanged" value={elecChanged ? "1" : ""} />
      <input type="hidden" name="elecOldEnd" value={elecOldEnd} />

      <Input
        label="ค่าเช่า (บาท)"
        name="rent"
        type="number"
        value={rent}
        onChange={(e) => setRent(Number(e.target.value) || 0)}
      />

      <div className="rounded-xl bg-slate-50 p-3 space-y-3">
        <div className="text-sm font-medium text-slate-600">
          มิเตอร์น้ำ ({wRate} บาท/หน่วย)
          {waterChanged && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              เปลี่ยนมิเตอร์ — เก่าสิ้นสุด {waterOldEnd}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="เลขครั้งก่อน"
            name="prevWater"
            type="number"
            value={prevWater}
            onChange={(e) => setPrevWater(Number(e.target.value) || 0)}
          />
          <Input
            label="เลขครั้งนี้"
            name="currWater"
            type="number"
            value={currWater}
            onChange={(e) => setCurrWater(Number(e.target.value) || 0)}
          />
        </div>
        <div className="text-sm text-slate-500">
          ใช้ไป {c.waterUnits} หน่วย = {baht(c.waterCost)}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-3 space-y-3">
        <div className="text-sm font-medium text-slate-600">
          มิเตอร์ไฟ ({eRate} บาท/หน่วย)
          {elecChanged && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              เปลี่ยนมิเตอร์ — เก่าสิ้นสุด {elecOldEnd}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="เลขครั้งก่อน"
            name="prevElec"
            type="number"
            value={prevElec}
            onChange={(e) => setPrevElec(Number(e.target.value) || 0)}
          />
          <Input
            label="เลขครั้งนี้"
            name="currElec"
            type="number"
            value={currElec}
            onChange={(e) => setCurrElec(Number(e.target.value) || 0)}
          />
        </div>
        <div className="text-sm text-slate-500">
          ใช้ไป {c.elecUnits} หน่วย = {baht(c.elecCost)}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">
            รายการเพิ่มเติม
          </span>
          <button
            type="button"
            onClick={addItem}
            className="text-sm text-brand-700 hover:text-brand-800 font-medium"
          >
            + เพิ่มรายการ
          </button>
        </div>
        {presets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {presets.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setItems((xs) => [...xs, { ...p }])}
                className="text-xs rounded-full bg-white border border-slate-200 px-3 py-1 hover:border-brand-300 hover:text-brand-700 transition"
              >
                + {p.label} ({p.amount})
              </button>
            ))}
          </div>
        )}
        {items.length === 0 && presets.length === 0 && (
          <p className="text-sm text-slate-400">
            เช่น ค่าที่จอดรถ ค่าส่วนกลาง ค่าปรับ
          </p>
        )}
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              placeholder="ชื่อรายการ"
              value={it.label}
              onChange={(e) => patchItem(i, { label: e.target.value })}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <input
              type="number"
              placeholder="0"
              value={it.amount}
              onChange={(e) => patchItem(i, { amount: Number(e.target.value) || 0 })}
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 text-sm"
              aria-label="ลบรายการ"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <DatePicker
        label="กำหนดชำระ"
        name="dueDate"
        defaultValue={
          inv?.dueDate
            ? inv.dueDate.slice(0, 10)
            : dueDay
              ? // ตั้งค่าเริ่มต้นจาก "กำหนดชำระภายในวันที่" ในตั้งค่าหอพัก (เดือนเดียวกับบิล)
                `${period}-${String(dueDay).padStart(2, "0")}`
              : ""
        }
      />

      {od?.overdue && od.lateFee > 0 && (
        <div className="rounded-xl bg-red-50 p-3 flex items-center justify-between text-sm">
          <span className="text-red-600">
            ค่าปรับล่าช้า {od.daysLate} วัน
          </span>
          <span className="font-semibold text-red-600">+{baht(od.lateFee)}</span>
        </div>
      )}

      <div className="rounded-xl bg-brand-50 p-4 flex items-center justify-between">
        <span className="text-slate-600">ยอดรวมทั้งสิ้น</span>
        <span className="text-2xl font-bold text-brand-700">
          {baht(grandTotal)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition"
          >
            ← กลับ
          </button>
        )}
        <SaveButton className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
          บันทึกบิล
        </SaveButton>
        {inv && <input type="hidden" name="id" value={inv.id} />}
      </div>
    </form>
  );
}
