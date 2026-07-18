"use client";

import { useState } from "react";
import { roomLabel } from "@/lib/format";
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
};

export default function MetersClient({
  period,
  lines,
}: {
  period: string;
  lines: MeterLine[];
}) {
  const [rows, setRows] = useState(lines);
  const [saved, setSaved] = useState(false);

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

  const payload = rows.map((r) => ({
    roomId: r.roomId,
    water: r.water,
    elec: r.elec,
  }));

  return (
    <form
      action={async (fd) => {
        await saveMeters(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="space-y-5"
    >
      <input type="hidden" name="period" value={period} />
      <input type="hidden" name="rows" value={JSON.stringify(payload)} />

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
                  <table className="w-full min-w-[560px] table-fixed text-sm">
                    <colgroup>
                      <col className="w-[22%]" />
                      <col className="w-[8%]" />
                      <col className="w-[13%]" />
                      <col className="w-[15%]" />
                      <col className="w-[13%]" />
                      <col className="w-[15%]" />
                      <col className="w-[14%]" />
                    </colgroup>
                    <thead>
                      <tr className="text-xs text-slate-400 text-left">
                        <th className="py-1 font-medium">ห้อง</th>
                        <th className="py-1 font-medium text-center">สถานะ</th>
                        <th className="py-1 font-medium text-right">น้ำครั้งก่อน</th>
                        <th className="py-1 font-medium text-right">น้ำครั้งนี้</th>
                        <th className="py-1 font-medium text-right">ไฟครั้งก่อน</th>
                        <th className="py-1 font-medium text-right">ไฟครั้งนี้</th>
                        <th className="py-1 font-medium text-right">ใช้ไป (น้ำ/ไฟ)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => {
                        const wu = Math.max(0, r.water - r.prevWater);
                        const eu = Math.max(0, r.elec - r.prevElec);
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
                            <td className="py-1.5 text-right text-slate-400">
                              {r.prevWater}
                            </td>
                            <td className="py-1.5 pl-2">
                              <input
                                type="number"
                                value={r.water}
                                onChange={(e) =>
                                  patch(r.roomId, {
                                    water: Number(e.target.value) || 0,
                                  })
                                }
                                className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-brand-500"
                              />
                            </td>
                            <td className="py-1.5 text-right text-slate-400">
                              {r.prevElec}
                            </td>
                            <td className="py-1.5 pl-2">
                              <input
                                type="number"
                                value={r.elec}
                                onChange={(e) =>
                                  patch(r.roomId, {
                                    elec: Number(e.target.value) || 0,
                                  })
                                }
                                className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-brand-500"
                              />
                            </td>
                            <td className="py-1.5 text-right text-slate-500 whitespace-nowrap">
                              {wu} / {eu}
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
    </form>
  );
}
