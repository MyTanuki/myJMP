"use client";

import { useEffect, useRef, useState } from "react";

const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const TH_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];
const TH_DOW = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function toDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// แสดง DD/MM/YYYY + ปฏิทินเลือกวัน/เดือน/ปี, ส่งค่าเป็น YYYY-MM-DD ผ่าน hidden input ชื่อ name
export default function DatePicker({
  label,
  name,
  value,
  defaultValue,
  onChange,
}: {
  label?: string;
  name: string;
  value?: string; // controlled "YYYY-MM-DD"
  defaultValue?: string;
  onChange?: (v: string) => void;
}) {
  const [internal, setInternal] = useState(value ?? defaultValue ?? "");
  const iso = value !== undefined ? value : internal;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"day" | "month" | "year">("day");
  const ref = useRef<HTMLDivElement>(null);

  const seed = iso ? new Date(iso + "T00:00:00") : new Date();
  const [view, setView] = useState({ y: seed.getFullYear(), m: seed.getMonth() });

  // เปิดปฏิทิน → เด้งไปเดือนของค่าปัจจุบัน + รีเซ็ตเป็นโหมดวัน + ผูก outside-click
  useEffect(() => {
    if (!open) return;
    const base = iso ? new Date(iso + "T00:00:00") : new Date();
    setView({ y: base.getFullYear(), m: base.getMonth() });
    setMode("day");
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (v: string) => {
    if (value === undefined) setInternal(v);
    onChange?.(v);
  };

  const pickDay = (day: number) => {
    const mm = String(view.m + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    set(`${view.y}-${mm}-${dd}`);
    setOpen(false);
  };

  const step = (dir: 1 | -1) => {
    setView((v) => {
      if (mode === "day") {
        const m = v.m + dir;
        if (m < 0) return { y: v.y - 1, m: 11 };
        if (m > 11) return { y: v.y + 1, m: 0 };
        return { y: v.y, m };
      }
      if (mode === "month") return { ...v, y: v.y + dir };
      return { ...v, y: v.y + dir * 12 }; // year mode
    });
  };

  const title =
    mode === "day"
      ? `${TH_MONTHS[view.m]} ${view.y}`
      : mode === "month"
        ? `${view.y}`
        : `${view.y - 6} – ${view.y + 5}`;

  const cycleMode = () =>
    setMode((m) => (m === "day" ? "month" : m === "month" ? "year" : "year"));

  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="block relative" ref={ref}>
      {label && <span className="text-sm font-medium text-slate-600">{label}</span>}
      <input type="hidden" name={name} value={iso} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-1 w-full text-left rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition flex items-center justify-between"
      >
        <span className={iso ? "text-slate-800" : "text-slate-400"}>
          {iso ? toDisplay(iso) : "วว/ดด/ปปปป"}
        </span>
        <span className="text-slate-400">📅</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg p-3 w-72">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => step(-1)}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={cycleMode}
              className="text-sm font-semibold text-slate-700 px-3 py-1 rounded-lg hover:bg-slate-100"
            >
              {title}
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              ›
            </button>
          </div>

          {mode === "day" && (
            <>
              <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-slate-400 mb-1">
                {TH_DOW.map((d) => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center text-sm">
                {cells.map((day, i) => {
                  if (day === null) return <div key={i} />;
                  const thisIso = `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const selected = thisIso === iso;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => pickDay(day)}
                      className={`py-1.5 rounded-lg transition ${
                        selected
                          ? "bg-brand-600 text-white font-medium"
                          : "text-slate-700 hover:bg-brand-50"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {mode === "month" && (
            <div className="grid grid-cols-3 gap-1 text-sm">
              {TH_MONTHS_SHORT.map((mn, i) => (
                <button
                  key={mn}
                  type="button"
                  onClick={() => {
                    setView((v) => ({ ...v, m: i }));
                    setMode("day");
                  }}
                  className={`py-2 rounded-lg transition ${
                    i === view.m
                      ? "bg-brand-600 text-white font-medium"
                      : "text-slate-700 hover:bg-brand-50"
                  }`}
                >
                  {mn}
                </button>
              ))}
            </div>
          )}

          {mode === "year" && (
            <div className="grid grid-cols-3 gap-1 text-sm">
              {Array.from({ length: 12 }, (_, i) => view.y - 6 + i).map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => {
                    setView((v) => ({ ...v, y: yr }));
                    setMode("month");
                  }}
                  className={`py-2 rounded-lg transition ${
                    yr === view.y
                      ? "bg-brand-600 text-white font-medium"
                      : "text-slate-700 hover:bg-brand-50"
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
