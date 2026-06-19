"use client";

import { useRef } from "react";
import { baht } from "@/lib/format";
import { createPreset, deletePreset } from "./actions";

export type Preset = { id: string; label: string; amount: number };

export default function PresetsClient({ presets }: { presets: Preset[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {presets.length === 0 && (
          <p className="text-sm text-slate-400">
            ยังไม่มีรายการ — เพิ่มไว้เพื่อกดใส่บิลได้รวดเร็ว
          </p>
        )}
        {presets.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
          >
            <span className="text-slate-700">{p.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">{baht(p.amount)}</span>
              <form action={deletePreset}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  onClick={(e) => {
                    if (!confirm("ลบรายการนี้?")) e.preventDefault();
                  }}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  ลบ
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <form
        ref={formRef}
        action={async (fd) => {
          await createPreset(fd);
          formRef.current?.reset();
        }}
        className="flex items-center gap-2"
      >
        <input
          name="label"
          placeholder="ชื่อรายการ เช่น ค่าที่จอดรถ"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <input
          name="amount"
          type="number"
          placeholder="0"
          className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          เพิ่ม
        </button>
      </form>
    </div>
  );
}
