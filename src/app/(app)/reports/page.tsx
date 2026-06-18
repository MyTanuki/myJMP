import { db } from "@/lib/db";
import { requireAccess } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { baht, calcInvoice, currentPeriod, thaiMonth } from "@/lib/format";

function monthsBack(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export default async function ReportsPage() {
  await requireAccess("/reports");
  const months = monthsBack(6);
  const firstMonth = months[0].split("-").map(Number);
  const rangeStart = new Date(firstMonth[0], firstMonth[1] - 1, 1);

  const [txs, invoices, rooms] = await Promise.all([
    db.transaction.findMany({ where: { date: { gte: rangeStart } } }),
    db.invoice.findMany({ include: { items: true } }),
    db.room.findMany({
      include: { tenants: { where: { active: true }, take: 1 } },
    }),
  ]);

  // รายรับ-รายจ่ายต่อเดือน
  const byMonth = months.map((m) => {
    const inM = txs.filter(
      (t) =>
        `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}` ===
        m
    );
    const income = inM
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = inM
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return { month: m, income, expense };
  });
  const maxBar = Math.max(1, ...byMonth.map((b) => Math.max(b.income, b.expense)));

  // การเก็บค่าเช่าเดือนปัจจุบัน
  const period = currentPeriod();
  const periodInv = invoices.filter((i) => i.period === period);
  const billed = periodInv.reduce((s, i) => s + calcInvoice(i).total, 0);
  const collected = periodInv
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + calcInvoice(i).total, 0);
  const collectRate = billed ? Math.round((collected / billed) * 100) : 0;

  // อัตราเข้าพัก
  const occupied = rooms.filter((r) => r.tenants.length > 0).length;
  const occRate = rooms.length
    ? Math.round((occupied / rooms.length) * 100)
    : 0;

  const totalIncome = byMonth.reduce((s, b) => s + b.income, 0);
  const totalExpense = byMonth.reduce((s, b) => s + b.expense, 0);

  return (
    <>
      <PageHeader title="รายงาน" subtitle="ภาพรวมการเงินและการเข้าพัก" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi label="รายรับ 6 เดือน" value={baht(totalIncome)} tone="text-emerald-600" />
        <Kpi label="รายจ่าย 6 เดือน" value={baht(totalExpense)} tone="text-red-600" />
        <Kpi
          label={`เก็บค่าเช่า ${thaiMonth(period)}`}
          value={`${collectRate}%`}
          tone="text-brand-700"
        />
        <Kpi label="อัตราเข้าพัก" value={`${occRate}%`} tone="text-slate-800" />
      </div>

      <Card className="p-6 mb-4">
        <div className="font-semibold text-slate-800 mb-4">
          รายรับ-รายจ่ายย้อนหลัง 6 เดือน
        </div>
        <div className="space-y-3">
          {byMonth.map((b) => (
            <div key={b.month}>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{thaiMonth(b.month)}</span>
                <span>
                  <span className="text-emerald-600">{baht(b.income)}</span>
                  {" / "}
                  <span className="text-red-600">{baht(b.expense)}</span>
                </span>
              </div>
              <div className="flex gap-1 h-3">
                <div
                  className="bg-emerald-400 rounded-l"
                  style={{ width: `${(b.income / maxBar) * 50}%` }}
                />
                <div
                  className="bg-red-400 rounded-r"
                  style={{ width: `${(b.expense / maxBar) * 50}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs text-slate-500">
          <Legend color="bg-emerald-400" label="รายรับ" />
          <Legend color="bg-red-400" label="รายจ่าย" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="font-semibold text-slate-800 mb-3">
          การเก็บค่าเช่า {thaiMonth(period)}
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Mini label="ออกบิล" value={baht(billed)} />
          <Mini label="เก็บได้" value={baht(collected)} tone="text-emerald-600" />
          <Mini
            label="ค้างชำระ"
            value={baht(billed - collected)}
            tone="text-red-600"
          />
        </div>
        <div className="h-3 rounded-full overflow-hidden bg-slate-100 mt-4">
          <div
            className="bg-emerald-500 h-full"
            style={{ width: `${collectRate}%` }}
          />
        </div>
      </Card>
    </>
  );
}

function Kpi({
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
      <div className={`text-xl font-bold mt-1 ${tone}`}>{value}</div>
    </Card>
  );
}

function Mini({
  label,
  value,
  tone = "text-slate-800",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`font-bold mt-1 ${tone}`}>{value}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded ${color}`} />
      {label}
    </span>
  );
}
