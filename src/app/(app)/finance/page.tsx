import Link from "next/link";
import { db } from "@/lib/db";
import { requireAccess } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { baht, currentPeriod, roomLabel, thaiMonth } from "@/lib/format";
import FinanceClient, { TxRow, RoomOption } from "./FinanceClient";

function shiftPeriod(period: string, delta: number) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireAccess("/finance");
  const sp = await searchParams;
  const period =
    sp.period && /^\d{4}-\d{2}$/.test(sp.period) ? sp.period : currentPeriod();

  const [y, m] = period.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const [txs, rooms] = await Promise.all([
    db.transaction.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
      include: { room: true },
    }),
    db.room.findMany({
      orderBy: [{ building: "asc" }, { floor: "asc" }, { number: "asc" }],
    }),
  ]);

  const rows: TxRow[] = txs.map((t) => ({
    id: t.id,
    type: t.type,
    category: t.category,
    amount: t.amount,
    date: t.date.toISOString(),
    note: t.note,
    roomId: t.roomId,
    roomNumber: t.room ? roomLabel(t.room.building, t.room.number) : null,
  }));

  const income = rows
    .filter((r) => r.type === "income")
    .reduce((s, r) => s + r.amount, 0);
  const expense = rows
    .filter((r) => r.type === "expense")
    .reduce((s, r) => s + r.amount, 0);
  const net = income - expense;

  const roomOptions: RoomOption[] = rooms.map((r) => ({
    id: r.id,
    number: roomLabel(r.building, r.number),
  }));

  return (
    <>
      <PageHeader title="รายรับ-รายจ่าย" subtitle="บันทึกการเงินของหอพัก" />

      <div className="flex items-center justify-center gap-4 mb-6">
        <Link
          href={`/finance?period=${shiftPeriod(period, -1)}`}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
        >
          ←
        </Link>
        <div className="text-lg font-semibold text-slate-800 min-w-44 text-center">
          {thaiMonth(period)}
        </div>
        <Link
          href={`/finance?period=${shiftPeriod(period, 1)}`}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
        >
          →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="รายรับ" value={baht(income)} tone="text-emerald-600" />
        <Stat label="รายจ่าย" value={baht(expense)} tone="text-red-600" />
        <Stat
          label="คงเหลือสุทธิ"
          value={baht(net)}
          tone={net >= 0 ? "text-slate-800" : "text-red-600"}
        />
      </div>

      <FinanceClient rows={rows} rooms={roomOptions} />

      {rows.length === 0 && (
        <EmptyState
          icon="💰"
          title="ยังไม่มีรายการในเดือนนี้"
          hint="กด “บันทึกรายการ” เพื่อเพิ่มรายรับหรือรายจ่าย"
        />
      )}
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
