import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { allowedBuildings } from "@/lib/permissions";
import { monthlyRent, roomLabel, thaiMonth } from "@/lib/format";
import { Card } from "@/components/ui";
import BillPageClient from "./BillPageClient";
import type { RoomLine } from "../InvoicesClient";

// หน้ารายละเอียดบิลแบบเต็มหน้า (ไม่ใช่ popup) ตามต้นแบบ
export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();

  const inv = await db.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!inv) notFound();

  const period = inv.period;
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  const prevPeriod = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const room = await db.room.findUnique({
    where: { id: inv.roomId },
    include: {
      tenants: { where: { active: true }, take: 1 },
      invoices: { include: { items: true } },
      meterReadings: { where: { period: { in: [period, prevPeriod] } } },
    },
  });
  if (!room) notFound();

  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);
  if (allowed && !allowed.includes(room.building)) notFound();

  const presets = await db.servicePreset.findMany({
    orderBy: { createdAt: "asc" },
  });

  // ประกอบ RoomLine แบบเดียวกับหน้ารายการบิล (สำหรับโหมดแก้ไข)
  const earlier = room.invoices
    .filter((i) => i.period < period)
    .sort((a, b) => (a.period < b.period ? 1 : -1))[0];
  const curReading = room.meterReadings.find((r) => r.period === period);
  const prevReading = room.meterReadings.find((r) => r.period === prevPeriod);
  const t0 = room.tenants[0];
  const startDate = t0?.contractStart ?? t0?.moveInDate ?? null;
  const movedInThisPeriod =
    !!startDate &&
    `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}` ===
      period;

  const line: RoomLine = {
    roomId: room.id,
    building: room.building,
    floor: room.floor,
    number: room.number,
    tenant: t0?.name ?? null,
    tenantPhone: t0?.phone ?? null,
    tenantIdCard: t0?.idCard ?? null,
    tenantAddress: t0
      ? [t0.address, t0.subdistrict, t0.district, t0.province, t0.postalCode]
          .filter(Boolean)
          .join(" ") || null
      : null,
    basePrice: monthlyRent(room),
    waterRate: room.waterRate ?? user?.waterRate ?? 18,
    elecRate: room.elecRate ?? user?.elecRate ?? 8,
    prevWater:
      movedInThisPeriod && t0?.moveInWater != null
        ? t0.moveInWater
        : (prevReading?.water ?? earlier?.currWater ?? 0),
    prevElec:
      movedInThisPeriod && t0?.moveInElec != null
        ? t0.moveInElec
        : (prevReading?.elec ?? earlier?.currElec ?? 0),
    meterWater: curReading?.water ?? null,
    meterElec: curReading?.elec ?? null,
    meterWaterChanged: curReading?.waterMeterChanged ?? false,
    meterWaterOldEnd: curReading?.waterOldEnd ?? 0,
    meterElecChanged: curReading?.elecMeterChanged ?? false,
    meterElecOldEnd: curReading?.elecOldEnd ?? 0,
    prevItems: (earlier?.items ?? []).map((it) => ({
      label: it.label,
      amount: it.amount,
    })),
    invoice: {
      id: inv.id,
      rent: inv.rent,
      prevWater: inv.prevWater,
      currWater: inv.currWater,
      prevElec: inv.prevElec,
      currElec: inv.currElec,
      waterRate: inv.waterRate,
      elecRate: inv.elecRate,
      other: inv.other,
      otherNote: inv.otherNote,
      waterMeterChanged: inv.waterMeterChanged,
      waterOldEnd: inv.waterOldEnd,
      elecMeterChanged: inv.elecMeterChanged,
      elecOldEnd: inv.elecOldEnd,
      status: inv.status,
      dueDate: inv.dueDate?.toISOString() ?? null,
      paidDate: inv.paidDate?.toISOString() ?? null,
      paymentMethod: inv.paymentMethod,
      paidAmount: inv.paidAmount,
      paymentNote: inv.paymentNote,
      cancelNote: inv.cancelNote,
      items: inv.items.map((it) => ({ label: it.label, amount: it.amount })),
    },
  };

  const backHref = `/invoices?period=${period}`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* แถบหัวแบบต้นแบบ: ห้อง + เดือน + เลขที่บิล + ปิด */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-100 px-5 py-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 truncate">
            ห้อง {roomLabel(room.building, room.number)}{" "}
            <span className="text-slate-500 font-normal">
              · {thaiMonth(period)}
            </span>
          </div>
          <div className="text-xs text-slate-400">
            INV{period.replace("-", "")}-{room.building}
            {room.number}
          </div>
        </div>
        <Link
          href={backHref}
          aria-label="ปิด"
          className="grid place-items-center w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition shrink-0"
        >
          ✕
        </Link>
      </div>

      <Card className="p-6">
        <BillPageClient
          line={line}
          period={period}
          presets={presets.map((p) => ({ label: p.label, amount: p.amount }))}
          lateFeePerDay={user?.lateFeePerDay ?? 0}
          dueDay={user?.dueDay ?? null}
          backHref={backHref}
        />
      </Card>
    </div>
  );
}
