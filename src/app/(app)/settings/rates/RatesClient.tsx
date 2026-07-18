"use client";

import { useState } from "react";
import { roomLabel } from "@/lib/format";
import SaveButton from "@/components/SaveButton";
import { saveRoomRates } from "../actions";

type RoomRate = {
  id: string;
  building: string;
  floor: number;
  number: string;
  waterRate: number | null; // null = ใช้ค่ากลาง
  elecRate: number | null;
};

export default function RatesClient({
  rooms,
  defaultWater,
  defaultElec,
}: {
  rooms: RoomRate[];
  defaultWater: number;
  defaultElec: number;
}) {
  const [rows, setRows] = useState(rooms);
  const [saved, setSaved] = useState(false);

  const patch = (id: string, p: Partial<RoomRate>) =>
    setRows((xs) => xs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  // จัดกลุ่ม อาคาร → ชั้น
  const buildings = new Map<string, Map<number, RoomRate[]>>();
  for (const r of rows) {
    if (!buildings.has(r.building)) buildings.set(r.building, new Map());
    const fl = buildings.get(r.building)!;
    if (!fl.has(r.floor)) fl.set(r.floor, []);
    fl.get(r.floor)!.push(r);
  }

  const payload = rows.map((r) => ({
    roomId: r.id,
    waterRate: r.waterRate,
    elecRate: r.elecRate,
  }));

  // เติมอัตราเดียวกันทั้งชั้น
  const applyFloor = (
    building: string,
    floor: number,
    p: { waterRate?: number | null; elecRate?: number | null }
  ) =>
    setRows((xs) =>
      xs.map((r) =>
        r.building === building && r.floor === floor ? { ...r, ...p } : r
      )
    );

  return (
    <form
      action={async (fd) => {
        await saveRoomRates(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="rows" value={JSON.stringify(payload)} />

      {[...buildings.entries()].map(([building, floors]) => (
        <div
          key={building}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="font-semibold text-slate-700 mb-3">
            อาคาร {building} — อัตรารายห้อง
          </div>
          <p className="text-xs text-slate-400 mb-3">
            เว้นว่าง = ใช้อัตรากลาง (น้ำ {defaultWater} / ไฟ {defaultElec}{" "}
            บาทต่อหน่วย)
          </p>
          <div className="space-y-4">
            {[...floors.entries()].map(([floor, list]) => (
              <div key={floor}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-500">
                    ชั้น {floor}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      applyFloor(building, floor, {
                        waterRate: null,
                        elecRate: null,
                      })
                    }
                    className="text-xs rounded-full border border-slate-200 px-3 py-1 text-slate-500 hover:border-brand-300 hover:text-brand-700 transition"
                  >
                    ใช้ค่ากลางทั้งชั้น
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const first = list[0];
                      applyFloor(building, floor, {
                        waterRate: first?.waterRate ?? null,
                        elecRate: first?.elecRate ?? null,
                      });
                    }}
                    className="text-xs rounded-full border border-slate-200 px-3 py-1 text-slate-500 hover:border-brand-300 hover:text-brand-700 transition"
                  >
                    ใช้ค่าห้องแรกทั้งชั้น
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] table-fixed text-sm">
                    <colgroup>
                      <col className="w-[34%]" />
                      <col className="w-[33%]" />
                      <col className="w-[33%]" />
                    </colgroup>
                    <thead>
                      <tr className="text-xs text-slate-400 text-left">
                        <th className="py-1 font-medium">ห้อง</th>
                        <th className="py-1 font-medium">💧 ค่าน้ำ (บาท/หน่วย)</th>
                        <th className="py-1 font-medium">⚡ ค่าไฟ (บาท/หน่วย)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => (
                        <tr key={r.id} className="border-t border-slate-50">
                          <td className="py-1.5 font-medium text-slate-700">
                            {roomLabel(r.building, r.number)}
                          </td>
                          <td className="py-1.5 pr-2">
                            <input
                              type="number"
                              step="any"
                              value={r.waterRate ?? ""}
                              placeholder={`ค่ากลาง ${defaultWater}`}
                              onChange={(e) =>
                                patch(r.id, {
                                  waterRate:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value) || 0,
                                })
                              }
                              className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-brand-500"
                            />
                          </td>
                          <td className="py-1.5">
                            <input
                              type="number"
                              step="any"
                              value={r.elecRate ?? ""}
                              placeholder={`ค่ากลาง ${defaultElec}`}
                              onChange={(e) =>
                                patch(r.id, {
                                  elecRate:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value) || 0,
                                })
                              }
                              className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-brand-500"
                            />
                          </td>
                        </tr>
                      ))}
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
          บันทึกอัตรารายห้อง
        </SaveButton>
      </div>
    </form>
  );
}
