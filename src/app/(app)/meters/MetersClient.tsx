"use client";

import { useRef, useState } from "react";
import { roomLabel, thaiMonth, thaiDate, meterUnits } from "@/lib/format";
import SaveButton from "@/components/SaveButton";
import { saveMeters } from "./actions";

export type MeterLine = {
  roomId: string;
  building: string;
  floor: number;
  number: string;
  tenant: string | null;
  prevWater: number;
  prevElec: number;
  water: number;
  elec: number;
  waterMeterChanged: boolean;
  waterOldEnd: number;
  elecMeterChanged: boolean;
  elecOldEnd: number;
  // ผู้เช่าเข้าพักในเดือนนี้ → ใช้เลขมิเตอร์ตอนเข้าพักเป็นตัวตั้งได้ (แบบต้นแบบ)
  moveIn: { water: number | null; elec: number | null; startDate: string } | null;
};

type Mode = "water" | "elec";

function shiftPeriod(period: string, delta: number) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MetersClient({
  period,
  lines,
}: {
  period: string;
  lines: MeterLine[];
}) {
  const [rows, setRows] = useState(lines);
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<Mode>("water");
  const [modalRoomId, setModalRoomId] = useState<string | null>(null);
  // ห้องที่ผู้เช่าเข้าพักเดือนนี้ — ติ๊ก "ใช้เลขเข้าพัก" เป็นค่าเริ่มต้น (แบบต้นแบบ)
  const [useMoveIn, setUseMoveIn] = useState<Set<string>>(
    () => new Set(lines.filter((l) => l.moveIn).map((l) => l.roomId))
  );
  // ค่าเริ่มต้นไว้เทียบ — บันทึกเฉพาะห้องที่แก้จริง กันเขียนทับห้องอื่นด้วยค่าเดิม/ศูนย์
  const initialRef = useRef(new Map(lines.map((l) => [l.roomId, l])));

  const prevLabel = thaiMonth(shiftPeriod(period, -1));
  const curLabel = thaiMonth(period);

  const patch = (roomId: string, p: Partial<MeterLine>) =>
    setRows((xs) => xs.map((r) => (r.roomId === roomId ? { ...r, ...p } : r)));

  // จัดกลุ่ม อาคาร → ชั้น (rows เรียงมาแล้วจากเซิร์ฟเวอร์)
  const buildings = new Map<string, Map<number, MeterLine[]>>();
  for (const r of rows) {
    if (!buildings.has(r.building)) buildings.set(r.building, new Map());
    const fl = buildings.get(r.building)!;
    if (!fl.has(r.floor)) fl.set(r.floor, []);
    fl.get(r.floor)!.push(r);
  }

  const isDirty = (r: MeterLine) => {
    const o = initialRef.current.get(r.roomId);
    if (!o) return true;
    return (
      o.water !== r.water ||
      o.elec !== r.elec ||
      o.waterMeterChanged !== r.waterMeterChanged ||
      o.waterOldEnd !== r.waterOldEnd ||
      o.elecMeterChanged !== r.elecMeterChanged ||
      o.elecOldEnd !== r.elecOldEnd
    );
  };

  // ส่งเฉพาะห้องที่มีการแก้ไข
  const payload = rows.filter(isDirty).map((r) => ({
    roomId: r.roomId,
    water: r.water,
    elec: r.elec,
    waterMeterChanged: r.waterMeterChanged,
    waterOldEnd: r.waterOldEnd,
    elecMeterChanged: r.elecMeterChanged,
    elecOldEnd: r.elecOldEnd,
  }));

  const modalRow = modalRoomId
    ? rows.find((r) => r.roomId === modalRoomId) ?? null
    : null;

  return (
    <form
      action={async (fd) => {
        await saveMeters(fd);
        // รีเซ็ตฐานเทียบเป็นค่าที่เพิ่งบันทึก
        initialRef.current = new Map(rows.map((r) => [r.roomId, { ...r }]));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="space-y-5"
    >
      <input type="hidden" name="period" value={period} />
      <input type="hidden" name="rows" value={JSON.stringify(payload)} />

      <div className="flex rounded-full bg-white border border-slate-200 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setMode("water")}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
            mode === "water"
              ? "bg-sky-500 text-white shadow"
              : "text-sky-600 hover:bg-sky-50"
          }`}
        >
          💧 จดมิเตอร์น้ำ
        </button>
        <button
          type="button"
          onClick={() => setMode("elec")}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
            mode === "elec"
              ? "bg-rose-500 text-white shadow"
              : "text-rose-600 hover:bg-rose-50"
          }`}
        >
          ⚡ จดมิเตอร์ไฟฟ้า
        </button>
      </div>

      {[...buildings.entries()].map(([building, floors]) => (
        <div key={building} className="rounded-xl border border-slate-200 p-4">
          <div className="font-semibold text-slate-700 mb-3">อาคาร {building}</div>
          <div className="space-y-4">
            {[...floors.entries()].map(([floor, list]) => (
              <div key={floor}>
                <div className="text-sm font-semibold text-slate-500 mb-2">
                  ชั้น {floor}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] table-fixed text-sm">
                    <colgroup>
                      <col className="w-[24%]" />
                      <col className="w-[10%]" />
                      <col className="w-[8%]" />
                      <col className="w-[21%]" />
                      <col className="w-[23%]" />
                      <col className="w-[14%]" />
                    </colgroup>
                    <thead>
                      <tr className="text-xs text-slate-400 text-left">
                        <th className="py-1 font-medium">ห้อง</th>
                        <th className="py-1 font-medium text-center">สถานะห้อง</th>
                        <th className="py-1 font-medium text-center">อื่นๆ</th>
                        <th className="py-1 font-medium text-right">
                          เลขมิเตอร์เดือน ({prevLabel})
                        </th>
                        <th className="py-1 font-medium text-right">
                          เลขมิเตอร์เดือน ({curLabel})
                        </th>
                        <th className="py-1 font-medium text-right">หน่วยที่ใช้</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => {
                        // เข้าพักเดือนนี้ + ติ๊กใช้เลขเข้าพัก → ตัวตั้ง = เลขมิเตอร์ตอนเข้าพัก
                        const moveInVal =
                          mode === "water" ? r.moveIn?.water : r.moveIn?.elec;
                        const usingMoveIn =
                          r.moveIn != null &&
                          moveInVal != null &&
                          useMoveIn.has(r.roomId);
                        const prev = usingMoveIn
                          ? moveInVal
                          : mode === "water"
                            ? r.prevWater
                            : r.prevElec;
                        const cur = mode === "water" ? r.water : r.elec;
                        const changed =
                          mode === "water"
                            ? r.waterMeterChanged
                            : r.elecMeterChanged;
                        const oldEnd =
                          mode === "water" ? r.waterOldEnd : r.elecOldEnd;
                        const used = changed
                          ? meterUnits(prev, cur, true, oldEnd)
                          : cur - prev;
                        return (
                          <tr key={r.roomId} className="border-t border-slate-50">
                            <td className="py-1.5">
                              <div className="font-medium text-slate-700">
                                {roomLabel(r.building, r.number)}
                              </div>
                              {r.tenant && (
                                <div className="text-xs text-slate-400">
                                  {r.tenant}
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 text-center">
                              {r.tenant && (
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="w-4 h-4 inline-block text-slate-500"
                                >
                                  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.58-5-8-5Z" />
                                </svg>
                              )}
                            </td>
                            <td className="py-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => setModalRoomId(r.roomId)}
                                title="มิเตอร์เต็ม/เปลี่ยนมิเตอร์"
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition ${
                                  r.waterMeterChanged || r.elecMeterChanged
                                    ? "border-amber-400 bg-amber-50 text-amber-600"
                                    : "border-slate-200 text-slate-400 hover:bg-slate-50"
                                }`}
                              >
                                ☰
                              </button>
                            </td>
                            <td className="py-1.5 text-right text-slate-400">
                              {prev}
                              {changed && (
                                <div className="text-[10px] text-amber-600 whitespace-nowrap">
                                  เก่าสิ้นสุด {oldEnd}
                                </div>
                              )}
                              {r.moveIn && moveInVal != null && (
                                <div className="text-[10px] whitespace-nowrap">
                                  <label className="inline-flex items-center gap-1 text-sky-700 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={useMoveIn.has(r.roomId)}
                                      onChange={() =>
                                        setUseMoveIn((s) => {
                                          const n = new Set(s);
                                          if (n.has(r.roomId)) n.delete(r.roomId);
                                          else n.add(r.roomId);
                                          return n;
                                        })
                                      }
                                    />
                                    ใช้เลขเข้าพัก ({moveInVal})
                                  </label>
                                  <div className="text-slate-400">
                                    เริ่มสัญญา {thaiDate(r.moveIn.startDate)}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 pl-2">
                              <div className="flex items-center gap-1.5">
                                <span className="shrink-0 text-xs">
                                  {mode === "water" ? "💧" : "⚡"}
                                </span>
                                <input
                                  type="number"
                                  value={cur}
                                  onChange={(e) =>
                                    patch(
                                      r.roomId,
                                      mode === "water"
                                        ? { water: Number(e.target.value) || 0 }
                                        : { elec: Number(e.target.value) || 0 }
                                    )
                                  }
                                  className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-brand-500"
                                />
                              </div>
                            </td>
                            <td className="py-1.5 text-right">
                              {used < 0 ? (
                                <span className="inline-block rounded-md bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                                  {used}
                                </span>
                              ) : (
                                <span className="text-slate-500">{used}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="sticky bottom-4 flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-600">บันทึกแล้ว</span>}
        <SaveButton className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg transition">
          บันทึกมิเตอร์
        </SaveButton>
      </div>

      {modalRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setModalRoomId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 font-semibold text-slate-800">
              มิเตอร์เต็ม/เปลี่ยนมิเตอร์ — ห้อง{" "}
              {roomLabel(modalRow.building, modalRow.number)}
            </div>
            <p className="mb-4 text-xs text-slate-500">
              ติ๊กเมื่อมิเตอร์วนครบรอบหรือเปลี่ยนลูกใหม่ แล้วกรอก
              “เลขสุดท้ายของมิเตอร์เก่า” ระบบจะคิดหน่วย = (เลขเก่าสุดท้าย −
              เลขครั้งก่อน) + เลขมิเตอร์ใหม่ และใช้สูตรนี้ตอนออกบิลด้วย
            </p>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={modalRow.waterMeterChanged}
                    onChange={(e) =>
                      patch(modalRow.roomId, {
                        waterMeterChanged: e.target.checked,
                      })
                    }
                  />
                  💧 มิเตอร์น้ำ เต็ม/เปลี่ยน
                </label>
                {modalRow.waterMeterChanged && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-slate-500 whitespace-nowrap">
                      เลขสุดท้ายมิเตอร์เก่า
                    </span>
                    <input
                      type="number"
                      value={modalRow.waterOldEnd}
                      onChange={(e) =>
                        patch(modalRow.roomId, {
                          waterOldEnd: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-brand-500"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={modalRow.elecMeterChanged}
                    onChange={(e) =>
                      patch(modalRow.roomId, {
                        elecMeterChanged: e.target.checked,
                      })
                    }
                  />
                  ⚡ มิเตอร์ไฟ เต็ม/เปลี่ยน
                </label>
                {modalRow.elecMeterChanged && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-slate-500 whitespace-nowrap">
                      เลขสุดท้ายมิเตอร์เก่า
                    </span>
                    <input
                      type="number"
                      value={modalRow.elecOldEnd}
                      onChange={(e) =>
                        patch(modalRow.roomId, {
                          elecOldEnd: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-brand-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setModalRoomId(null)}
                className="rounded-xl bg-brand-600 hover:bg-brand-700 px-5 py-2 text-sm font-medium text-white transition"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
