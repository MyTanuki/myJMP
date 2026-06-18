"use client";

import { useState } from "react";
import Modal, { Input, Select } from "@/components/Modal";
import { Badge } from "@/components/ui";
import { baht, thaiDate } from "@/lib/format";
import { createBooking, updateBooking, deleteBooking } from "./actions";

export type BookingRow = {
  id: string;
  name: string;
  phone: string | null;
  date: string;
  status: string;
  deposit: number;
  note: string | null;
  roomId: string | null;
  roomNumber: string | null;
};

export type RoomOption = { id: string; number: string };

const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "รอยืนยัน", tone: "amber" },
  confirmed: { label: "ยืนยันแล้ว", tone: "green" },
  cancelled: { label: "ยกเลิก", tone: "slate" },
};

function toInput(d: string) {
  return new Date(d).toISOString().slice(0, 10);
}

export default function BookingsClient({
  bookings,
  rooms,
}: {
  bookings: BookingRow[];
  rooms: RoomOption[];
}) {
  const [editing, setEditing] = useState<BookingRow | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <button
        onClick={() => setAdding(true)}
        className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2.5 rounded-xl transition"
      >
        + เพิ่มการจอง
      </button>

      <div className="mt-6 space-y-2">
        {bookings.map((b) => (
          <button
            key={b.id}
            onClick={() => setEditing(b)}
            className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-brand-200 hover:shadow transition flex flex-wrap items-center gap-3"
          >
            <div className="grid place-items-center w-12 h-12 rounded-xl bg-brand-50 text-brand-700 shrink-0 text-sm font-semibold">
              {b.roomNumber ?? "—"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-800 truncate">
                {b.name}
                {b.phone ? (
                  <span className="text-slate-400 font-normal"> · {b.phone}</span>
                ) : null}
              </div>
              <div className="text-sm text-slate-400 truncate">
                นัด {thaiDate(b.date)}
                {b.deposit > 0 ? ` · มัดจำ ${baht(b.deposit)}` : ""}
                {b.note ? ` · ${b.note}` : ""}
              </div>
            </div>
            <Badge tone={STATUS[b.status]?.tone ?? "slate"}>
              {STATUS[b.status]?.label ?? b.status}
            </Badge>
          </button>
        ))}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="เพิ่มการจอง">
        <form
          action={async (fd) => {
            await createBooking(fd);
            setAdding(false);
          }}
          className="space-y-4"
        >
          <BookingFields rooms={rooms} />
          <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
            บันทึก
          </button>
        </form>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="แก้ไขการจอง"
      >
        {editing && (
          <form
            action={async (fd) => {
              await updateBooking(fd);
              setEditing(null);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={editing.id} />
            <BookingFields rooms={rooms} booking={editing} />
            <div className="flex items-center gap-2">
              <button className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition">
                บันทึก
              </button>
              <button
                type="submit"
                formAction={async (fd) => {
                  await deleteBooking(fd);
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

function BookingFields({
  rooms,
  booking,
}: {
  rooms: RoomOption[];
  booking?: BookingRow;
}) {
  return (
    <>
      <Input label="ชื่อผู้จอง" name="name" defaultValue={booking?.name} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="เบอร์โทร" name="phone" defaultValue={booking?.phone ?? ""} />
        <Input
          label="วันที่นัด"
          name="date"
          type="date"
          defaultValue={
            booking ? toInput(booking.date) : new Date().toISOString().slice(0, 10)
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="ห้อง" name="roomId" defaultValue={booking?.roomId ?? ""}>
          <option value="">— ไม่ระบุ —</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              ห้อง {r.number}
            </option>
          ))}
        </Select>
        <Input
          label="เงินมัดจำ (บาท)"
          name="deposit"
          type="number"
          min={0}
          defaultValue={booking?.deposit ?? 0}
        />
      </div>
      <Select
        label="สถานะ"
        name="status"
        defaultValue={booking?.status ?? "pending"}
      >
        <option value="pending">รอยืนยัน</option>
        <option value="confirmed">ยืนยันแล้ว</option>
        <option value="cancelled">ยกเลิก</option>
      </Select>
      <Input label="หมายเหตุ" name="note" defaultValue={booking?.note ?? ""} />
    </>
  );
}
