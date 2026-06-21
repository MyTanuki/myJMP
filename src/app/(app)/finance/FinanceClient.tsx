"use client";

import { useState } from "react";
import Modal, { Input, Select } from "@/components/Modal";
import DatePicker from "@/components/DatePicker";
import { Badge } from "@/components/ui";
import SaveButton from "@/components/SaveButton";
import { baht, thaiDate } from "@/lib/format";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "./actions";

export type TxRow = {
  id: string;
  type: string;
  category: string;
  amount: number;
  date: string;
  note: string | null;
  roomId: string | null;
  roomNumber: string | null;
};

export type RoomOption = { id: string; number: string };

const INCOME_CATS = ["ค่าเช่า", "ค่ามัดจำ", "ค่าน้ำ-ไฟ", "รายรับอื่น"];
const EXPENSE_CATS = [
  "ซ่อมบำรุง",
  "เงินเดือนพนักงาน",
  "ค่าน้ำ-ไฟส่วนกลาง",
  "ค่าทำความสะอาด",
  "ภาษี",
  "รายจ่ายอื่น",
];

function toInput(d: string) {
  return new Date(d).toISOString().slice(0, 10);
}

export default function FinanceClient({
  rows,
  rooms,
}: {
  rows: TxRow[];
  rooms: RoomOption[];
}) {
  const [editing, setEditing] = useState<TxRow | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <button
        onClick={() => setAdding(true)}
        className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2.5 rounded-xl transition"
      >
        + บันทึกรายการ
      </button>

      <div className="mt-6 space-y-2">
        {rows.map((t) => {
          const income = t.type === "income";
          return (
            <button
              key={t.id}
              onClick={() => setEditing(t)}
              className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-brand-200 hover:shadow transition flex items-center gap-3"
            >
              <div
                className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${
                  income
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {income ? "↓" : "↑"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-800 truncate">
                  {t.category}
                  {t.roomNumber ? (
                    <span className="text-slate-400 font-normal">
                      {" "}
                      · ห้อง {t.roomNumber}
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-slate-400 truncate">
                  {thaiDate(t.date)}
                  {t.note ? ` · ${t.note}` : ""}
                </div>
              </div>
              <div
                className={`font-bold ${
                  income ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {income ? "+" : "-"}
                {baht(t.amount)}
              </div>
            </button>
          );
        })}
      </div>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="บันทึกรายรับ-รายจ่าย"
      >
        <form
          action={async (fd) => {
            await createTransaction(fd);
            setAdding(false);
          }}
          className="space-y-4"
        >
          <TxFields rooms={rooms} />
          <SaveButton className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
            บันทึก
          </SaveButton>
        </form>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="แก้ไขรายการ"
      >
        {editing && (
          <form
            action={async (fd) => {
              await updateTransaction(fd);
              setEditing(null);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={editing.id} />
            <TxFields rooms={rooms} tx={editing} />
            <div className="flex items-center gap-2">
              <SaveButton className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
                บันทึก
              </SaveButton>
              <button
                type="submit"
                formAction={async (fd) => {
                  if (!confirm("ลบรายการรายรับ-รายจ่ายนี้?\nเมื่อลบแล้วไม่สามารถย้อนกลับได้")) return;
                  await deleteTransaction(fd);
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

function TxFields({ rooms, tx }: { rooms: RoomOption[]; tx?: TxRow }) {
  const [type, setType] = useState(tx?.type ?? "expense");
  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-600">ประเภท</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(["income", "expense"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setType(v)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition ${
                  type === v
                    ? v === "income"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-red-50 border-red-300 text-red-700"
                    : "border-slate-200 text-slate-500"
                }`}
              >
                {v === "income" ? "รายรับ" : "รายจ่าย"}
              </button>
            ))}
          </div>
        </label>
        <Input
          label="จำนวนเงิน (บาท)"
          name="amount"
          type="number"
          min={0}
          defaultValue={tx?.amount ?? 0}
        />
      </div>
      <input type="hidden" name="type" value={type} />

      <Select label="หมวดหมู่" name="category" defaultValue={tx?.category}>
        {cats.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <DatePicker
          label="วันที่"
          name="date"
          defaultValue={tx ? toInput(tx.date) : new Date().toISOString().slice(0, 10)}
        />
        <Select label="ห้อง (ถ้ามี)" name="roomId" defaultValue={tx?.roomId ?? ""}>
          <option value="">— ไม่ระบุ —</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              ห้อง {r.number}
            </option>
          ))}
        </Select>
      </div>

      <Input label="หมายเหตุ" name="note" defaultValue={tx?.note ?? ""} />
    </>
  );
}
