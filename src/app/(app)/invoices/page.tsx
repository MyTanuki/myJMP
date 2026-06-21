import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { allowedBuildings } from "@/lib/permissions";
import { PageHeader, Card } from "@/components/ui";
import BackToRoom from "@/components/BackToRoom";
import {
  baht,
  calcInvoice,
  currentPeriod,
  monthlyRent,
  roomLabel,
  thaiMonth,
} from "@/lib/format";
import InvoicesClient, { RoomLine, InvoiceData } from "./InvoicesClient";

function shiftPeriod(period: string, delta: number) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; room?: string }>;
}) {
  const user = await currentUser();
  const sp = await searchParams;
  const roomId = sp.room;
  const period =
    sp.period && /^\d{4}-\d{2}$/.test(sp.period) ? sp.period : currentPeriod();
  const prevPeriod = shiftPeriod(period, -1);
  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);

  const [rooms, presets] = await Promise.all([
    db.room.findMany({
      where: roomId
        ? { id: roomId }
        : allowed
          ? { building: { in: allowed } }
          : {},
      orderBy: [
        { building: "asc" },
        { floor: "asc" },
        { sortOrder: "asc" },
        { number: "asc" },
      ],
      include: {
        tenants: { where: { active: true }, take: 1 },
        invoices: { include: { items: true } },
        meterReadings: { where: { period: { in: [period, prevPeriod] } } },
      },
    }),
    db.servicePreset.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const lines: RoomLine[] = rooms.map((r) => {
    const invForPeriod = r.invoices.find((i) => i.period === period) ?? null;
    // เลขมิเตอร์ครั้งก่อน: ใช้ที่จดไว้รอบก่อน ถ้าไม่มีใช้เลขครั้งล่าสุดจากบิลก่อนหน้า
    const earlier = r.invoices
      .filter((i) => i.period < period)
      .sort((a, b) => (a.period < b.period ? 1 : -1))[0];
    const curReading = r.meterReadings.find((m) => m.period === period);
    const prevReading = r.meterReadings.find((m) => m.period === prevPeriod);

    const invoice: InvoiceData | null = invForPeriod
      ? {
          id: invForPeriod.id,
          rent: invForPeriod.rent,
          prevWater: invForPeriod.prevWater,
          currWater: invForPeriod.currWater,
          prevElec: invForPeriod.prevElec,
          currElec: invForPeriod.currElec,
          waterRate: invForPeriod.waterRate,
          elecRate: invForPeriod.elecRate,
          other: invForPeriod.other,
          otherNote: invForPeriod.otherNote,
          status: invForPeriod.status,
          dueDate: invForPeriod.dueDate?.toISOString() ?? null,
          items: invForPeriod.items.map((it) => ({
            label: it.label,
            amount: it.amount,
          })),
        }
      : null;

    return {
      roomId: r.id,
      building: r.building,
      floor: r.floor,
      number: r.number,
      tenant: r.tenants[0]?.name ?? null,
      basePrice: monthlyRent(r),
      waterRate: r.waterRate ?? user?.waterRate ?? 18,
      elecRate: r.elecRate ?? user?.elecRate ?? 8,
      prevWater: prevReading?.water ?? earlier?.currWater ?? 0,
      prevElec: prevReading?.elec ?? earlier?.currElec ?? 0,
      meterWater: curReading?.water ?? null,
      meterElec: curReading?.elec ?? null,
      invoice,
    };
  });

  const issued = lines.filter((l) => l.invoice);
  const totalBilled = issued.reduce(
    (s, l) => s + calcInvoice(l.invoice!).total,
    0
  );
  const collected = issued
    .filter((l) => l.invoice!.status === "paid")
    .reduce((s, l) => s + calcInvoice(l.invoice!).total, 0);
  const outstanding = totalBilled - collected;
  const roomQ = roomId ? `room=${roomId}&` : "";
  const backRoom = roomId ? rooms.find((r) => r.id === roomId) : undefined;

  return (
    <>
      {backRoom && (
        <BackToRoom
          id={backRoom.id}
          label={roomLabel(backRoom.building, backRoom.number)}
        />
      )}
      <PageHeader title="บิล" subtitle="ออกบิลรายเดือน (จดมิเตอร์ที่เมนู จดมิเตอร์)" />

      <div className="flex items-center justify-center gap-4 mb-6">
        <Link
          href={`/invoices?${roomQ}period=${shiftPeriod(period, -1)}`}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
        >
          ←
        </Link>
        <div className="text-lg font-semibold text-slate-800 min-w-44 text-center">
          {thaiMonth(period)}
        </div>
        <Link
          href={`/invoices?${roomQ}period=${shiftPeriod(period, 1)}`}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
        >
          →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="ออกบิลแล้ว" value={baht(totalBilled)} tone="text-slate-800" />
        <Stat label="เก็บได้" value={baht(collected)} tone="text-emerald-600" />
        <Stat label="ค้างชำระ" value={baht(outstanding)} tone="text-red-600" />
      </div>

      <InvoicesClient
        period={period}
        lines={lines}
        presets={presets.map((p) => ({ label: p.label, amount: p.amount }))}
        lateFeePerDay={user?.lateFeePerDay ?? 0}
      />
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-lg font-bold mt-1 ${tone}`}>{value}</div>
    </Card>
  );
}
