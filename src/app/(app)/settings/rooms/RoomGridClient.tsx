"use client";

import { useRef, useState } from "react";
import { saveRoomGrid } from "./actions";

export type GridRow = {
  id?: string;
  building: string;
  floor: number | string;
  number: string;
  name: string;
};

export default function RoomGridClient({ initial }: { initial: GridRow[] }) {
  const [rows, setRows] = useState<GridRow[]>(
    initial.length ? initial : [blank()]
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // หาเลขห้องซ้ำภายในอาคารเดียวกัน
  function duplicateKey(): string | null {
    const seen = new Set<string>();
    for (const r of rows) {
      const num = r.number.trim();
      if (!num) continue;
      const key = `${r.building.trim()}-${num}`;
      if (seen.has(key)) return `${r.building.trim()} ห้อง ${num}`;
      seen.add(key);
    }
    return null;
  }

  function blankRow() {
    return blank();
  }
  const addRow = () => setRows((xs) => [...xs, blankRow()]);
  const removeRow = (i: number) =>
    setRows((xs) => (xs.length > 1 ? xs.filter((_, idx) => idx !== i) : xs));
  const patch = (i: number, p: Partial<GridRow>) =>
    setRows((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...p } : r)));

  const onDrop = (to: number) => {
    const from = dragFrom.current;
    dragFrom.current = null;
    setDragOver(null);
    if (from === null || from === to) return;
    setRows((xs) => {
      const next = [...xs];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  return (
    <form
      action={async (fd) => {
        const dup = duplicateKey();
        if (dup) {
          setError(`เลขห้องซ้ำ: ${dup} — แก้ไขก่อนบันทึก`);
          return;
        }
        setError(null);
        await saveRoomGrid(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="space-y-3"
    >
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[28px_1.2fr_0.8fr_1fr_1.6fr_40px] gap-2 pb-1 text-xs font-medium text-slate-400">
            <span></span>
            <span className="px-2">อาคาร</span>
            <span className="px-2">ชั้น</span>
            <span className="px-2">เลขห้อง</span>
            <span className="px-2">ชื่อห้อง</span>
            <span></span>
          </div>

          {rows.map((r, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => (dragFrom.current = i)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(i);
              }}
              onDrop={() => onDrop(i)}
              className={`grid grid-cols-[28px_1.2fr_0.8fr_1fr_1.6fr_40px] gap-2 items-center py-1 rounded-lg ${
                dragOver === i ? "bg-brand-50" : ""
              }`}
            >
              <span
                className="cursor-grab text-slate-300 text-center select-none"
                title="ลากเพื่อจัดลำดับ"
              >
                ⠿
              </span>
              <input
                value={r.building}
                onChange={(e) => patch(i, { building: e.target.value })}
                placeholder="A"
                className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-brand-500"
              />
              <input
                type="number"
                min={1}
                value={r.floor}
                onChange={(e) => patch(i, { floor: e.target.value })}
                className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-brand-500"
              />
              <input
                value={r.number}
                onChange={(e) => patch(i, { number: e.target.value })}
                placeholder="101"
                className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-brand-500"
              />
              <input
                value={r.name}
                onChange={(e) => patch(i, { name: e.target.value })}
                placeholder="(ไม่บังคับ)"
                className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-red-400 hover:text-red-600 text-center"
                aria-label="ลบแถว"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={addRow}
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          + เพิ่มแถว
        </button>
        <div className="flex-1" />
        {error && <span className="text-sm text-red-600">{error}</span>}
        {saved && <span className="text-sm text-emerald-600">บันทึกแล้ว</span>}
        <button className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-xl transition">
          บันทึกห้องพัก
        </button>
      </div>

      <p className="text-xs text-slate-400">
        ลากไอคอน ⠿ เพื่อจัดลำดับ · เลขห้องไม่ซ้ำภายในอาคารเดียวกัน · ลบได้เฉพาะห้องที่ยังไม่มีผู้เช่า ·
        ค่าเช่า/ประเภท/มิเตอร์ ตั้งได้ในเมนูห้องพัก
      </p>
    </form>
  );
}

function blank(): GridRow {
  return { building: "A", floor: 1, number: "", name: "" };
}
