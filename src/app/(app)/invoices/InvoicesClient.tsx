"use client";

import { useState } from "react";
import Modal, { Input } from "@/components/Modal";
import { Badge } from "@/components/ui";
import { baht, calcInvoice, overdueInfo, roomLabel } from "@/lib/format";
import { createInvoice, togglePaid, deleteInvoice } from "./actions";

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
  status: string;
  dueDate: string | null;
  items: { label: string; amount: number }[];
};

export type RoomLine = {
  roomId: string;
  building: string;
  floor: number;
  number: string;
  tenant: string | null;
  basePrice: number;
  waterRate: number; // อัตราที่ใช้จริง (ของห้อง หรือค่ากลาง)
  elecRate: number;
  prevWater: number; // จากเดือนก่อน
  prevElec: number;
  meterWater: number | null; // เลขมิเตอร์ที่จดไว้รอบนี้ (ถ้ามี)
  meterElec: number | null;
  invoice: InvoiceData | null;
};

export type Preset = { label: string; amount: number };

export default function InvoicesClient({
  period,
  lines,
  presets,
  lateFeePerDay,
}: {
  period: string;
  lines: RoomLine[];
  presets: Preset[];
  lateFeePerDay: number;
}) {
  const [active, setActive] = useState<RoomLine | null>(null);

  // จัดกลุ่มเป็น อาคาร → ชั้น (lines มาเรียงตามอาคาร/ชั้น/ห้องแล้วจากเซิร์ฟเวอร์)
  const buildings = new Map<string, Map<number, RoomLine[]>>();
  for (const line of lines) {
    if (!buildings.has(line.building)) buildings.set(line.building, new Map());
    const floors = buildings.get(line.building)!;
    if (!floors.has(line.floor)) floors.set(line.floor, []);
    floors.get(line.floor)!.push(line);
  }

  const renderRow = (line: RoomLine) => {
    const inv = line.invoice;
    const od = inv ? overdueInfo(inv, lateFeePerDay) : null;
    const total = inv ? calcInvoice(inv).total + (od?.lateFee ?? 0) : null;
    return (
      <button
        key={line.roomId}
        onClick={() => setActive(line)}
        className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-brand-200 hover:shadow transition flex flex-wrap items-center gap-3"
      >
        <div className="grid place-items-center w-12 h-12 rounded-xl bg-brand-50 text-brand-700 font-bold shrink-0">
          {line.number}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-800 truncate">
            ห้อง {line.number}
            {line.tenant ? (
              <span className="text-slate-400 font-normal"> · {line.tenant}</span>
            ) : (
              <span className="text-slate-300 font-normal"> · ว่าง</span>
            )}
          </div>
          <div className="text-sm text-slate-400">
            {inv
              ? `น้ำ ${Math.max(0, inv.currWater - inv.prevWater)} หน่วย · ไฟ ${Math.max(0, inv.currElec - inv.prevElec)} หน่วย`
              : "ยังไม่ออกบิล"}
          </div>
        </div>
        <div className="text-right">
          {inv ? (
            <>
              <div className="font-bold text-slate-800">{baht(total!)}</div>
              {inv.status === "paid" ? (
                <Badge tone="green">ชำระแล้ว</Badge>
              ) : od?.overdue ? (
                <Badge tone="red">เกินกำหนด {od.daysLate} วัน</Badge>
              ) : (
                <Badge tone="amber">ค้างชำระ</Badge>
              )}
            </>
          ) : (
            <Badge tone="amber">+ ออกบิล</Badge>
          )}
        </div>
      </button>
    );
  };

  return (
    <>
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
                  <div className="space-y-3">{list.map(renderRow)}</div>
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
          <InvoiceForm
            line={active}
            period={period}
            presets={presets}
            lateFeePerDay={lateFeePerDay}
            onDone={() => setActive(null)}
          />
        )}
      </Modal>
    </>
  );
}

function InvoiceForm({
  line,
  period,
  presets,
  lateFeePerDay,
  onDone,
}: {
  line: RoomLine;
  period: string;
  presets: Preset[];
  lateFeePerDay: number;
  onDone: () => void;
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
  const [items, setItems] = useState<{ label: string; amount: number }[]>(
    inv?.items ?? []
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

      <Input
        label="กำหนดชำระ"
        name="dueDate"
        type="date"
        defaultValue={inv?.dueDate ? inv.dueDate.slice(0, 10) : ""}
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
        <button className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
          บันทึกบิล
        </button>
        {inv && (
          <>
            <a
              href={`/invoices/${inv.id}/print`}
              target="_blank"
              className="px-4 py-2.5 rounded-xl text-brand-700 hover:bg-brand-50 font-medium transition"
            >
              พิมพ์บิล
            </a>
            <button
              type="submit"
              formAction={async (fd) => {
                await togglePaid(fd);
                onDone();
              }}
              className={`px-4 py-2.5 rounded-xl font-medium transition ${
                inv.status === "paid"
                  ? "text-amber-700 hover:bg-amber-50"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {inv.status === "paid" ? "ยกเลิกชำระ" : "ทำเครื่องหมายชำระ"}
            </button>
            <button
              type="submit"
              formAction={async (fd) => {
                await deleteInvoice(fd);
                onDone();
              }}
              className="px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 font-medium transition"
            >
              ลบ
            </button>
          </>
        )}
        {inv && <input type="hidden" name="id" value={inv.id} />}
        {inv && (
          <input
            type="hidden"
            name="status"
            value={inv.status === "paid" ? "unpaid" : "paid"}
          />
        )}
      </div>
    </form>
  );
}
