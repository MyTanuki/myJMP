import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import {
  baht,
  calcInvoice,
  currentPeriod,
  overdueInfo,
  thaiMonth,
} from "@/lib/format";

export default async function DashboardPage() {
  const user = await currentUser();
  const period = currentPeriod();

  const [rooms, activeTenants, invoices] = await Promise.all([
    db.room.findMany({
      include: { tenants: { where: { active: true }, take: 1 } },
    }),
    db.tenant.count({ where: { active: true } }),
    db.invoice.findMany({ where: { period }, include: { items: true } }),
  ]);

  const totalRooms = rooms.length;
  const occupied = rooms.filter((r) => r.tenants.length > 0).length;
  const vacant = totalRooms - occupied;
  const occRate = totalRooms ? Math.round((occupied / totalRooms) * 100) : 0;

  const billed = invoices.reduce((s, i) => s + calcInvoice(i).total, 0);
  const collected = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + calcInvoice(i).total, 0);
  const outstanding = billed - collected;
  const unpaidCount = invoices.filter((i) => i.status === "unpaid").length;
  const overdueCount = invoices.filter(
    (i) => overdueInfo(i, user?.lateFeePerDay ?? 0).overdue
  ).length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          สวัสดี {user?.name} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          ภาพรวม {user?.dormName} · ประจำเดือน{thaiMonth(period)}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="ห้องทั้งหมด"
          value={`${totalRooms}`}
          sub={`มีผู้เช่า ${occupied} · ว่าง ${vacant}`}
          icon="🏠"
          tone="bg-brand-50 text-brand-700"
        />
        <StatCard
          label="อัตราเข้าพัก"
          value={`${occRate}%`}
          sub={`ผู้เช่า ${activeTenants} คน`}
          icon="📈"
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="เก็บได้เดือนนี้"
          value={baht(collected)}
          sub={`จากที่ออกบิล ${baht(billed)}`}
          icon="💰"
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="ค้างชำระ"
          value={baht(outstanding)}
          sub={
            overdueCount
              ? `${unpaidCount} บิลค้าง · เกินกำหนด ${overdueCount}`
              : `${unpaidCount} บิลยังไม่จ่าย`
          }
          icon="⚠️"
          tone="bg-red-50 text-red-700"
        />
      </div>

    </>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  tone: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className={`grid place-items-center w-8 h-8 rounded-lg ${tone}`}>
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-800 mt-2">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
    </Card>
  );
}
