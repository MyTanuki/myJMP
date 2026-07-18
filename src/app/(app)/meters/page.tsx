import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { allowedBuildings } from "@/lib/permissions";
import { PageHeader, EmptyState } from "@/components/ui";
import { currentPeriod, thaiMonth } from "@/lib/format";
import MetersClient, { MeterLine } from "./MetersClient";

function shiftPeriod(period: string, delta: number) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function MetersPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const period =
    sp.period && /^\d{4}-\d{2}$/.test(sp.period) ? sp.period : currentPeriod();
  const prevPeriod = shiftPeriod(period, -1);

  const user = await currentUser();
  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);

  const rooms = await db.room.findMany({
    where: allowed ? { building: { in: allowed } } : {},
    orderBy: [
      { building: "asc" },
      { floor: "asc" },
      { sortOrder: "asc" },
      { number: "asc" },
    ],
    include: {
      tenants: { where: { active: true }, take: 1 },
      meterReadings: { where: { period: { in: [period, prevPeriod] } } },
      invoices: true,
    },
  });

  const lines: MeterLine[] = rooms.map((r) => {
    const cur = r.meterReadings.find((m) => m.period === period);
    const prev = r.meterReadings.find((m) => m.period === prevPeriod);
    // ถ้ายังไม่เคยจดมิเตอร์รอบก่อน ใช้เลขครั้งล่าสุดจากบิลก่อนหน้าเป็นตัวตั้ง
    const earlierInv = r.invoices
      .filter((i) => i.period < period)
      .sort((a, b) => (a.period < b.period ? 1 : -1))[0];

    const prevWater = prev?.water ?? earlierInv?.currWater ?? 0;
    const prevElec = prev?.elec ?? earlierInv?.currElec ?? 0;

    return {
      roomId: r.id,
      building: r.building,
      floor: r.floor,
      number: r.number,
      tenant: r.tenants[0]?.name ?? null,
      prevWater,
      prevElec,
      // ยังไม่จดรอบนี้ → เริ่มที่ 0 รอกรอก (ไม่ยกเลขเดือนก่อนมาใส่ให้ กันบันทึกเลขเก่าโดยไม่ตั้งใจ)
      water: cur?.water ?? 0,
      elec: cur?.elec ?? 0,
      waterMeterChanged: cur?.waterMeterChanged ?? false,
      waterOldEnd: cur?.waterOldEnd ?? 0,
      elecMeterChanged: cur?.elecMeterChanged ?? false,
      elecOldEnd: cur?.elecOldEnd ?? 0,
    };
  });

  return (
    <>
      <PageHeader title="จดมิเตอร์" subtitle="บันทึกเลขมิเตอร์น้ำ-ไฟ ทุกห้องในที่เดียว" />

      <div className="flex items-center justify-center gap-4 mb-6">
        <Link
          href={`/meters?period=${shiftPeriod(period, -1)}`}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
        >
          ←
        </Link>
        <div className="text-lg font-semibold text-slate-800 min-w-44 text-center">
          {thaiMonth(period)}
        </div>
        <Link
          href={`/meters?period=${shiftPeriod(period, 1)}`}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
        >
          →
        </Link>
      </div>

      {lines.length === 0 ? (
        <EmptyState
          icon="🔢"
          title="ยังไม่มีห้อง"
          hint="เพิ่มห้องที่ ตั้งค่า › จัดการห้องพัก"
        />
      ) : (
        <MetersClient key={period} period={period} lines={lines} />
      )}
    </>
  );
}
