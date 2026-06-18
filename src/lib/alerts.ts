import "server-only";
import { db } from "./db";
import { overdueInfo } from "./format";

export type Alert = {
  key: string;
  icon: string;
  label: string;
  count: number;
  href: string;
  tone: "red" | "amber" | "blue";
};

export async function getAlerts(): Promise<{ items: Alert[]; total: number }> {
  const now = new Date();
  const in30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);

  const [unpaid, waitingParcels, openIssues, pendingBookings, expiring] =
    await Promise.all([
      db.invoice.findMany({
        where: { status: "unpaid" },
        select: { status: true, dueDate: true },
      }),
      db.parcel.count({ where: { pickedUp: false } }),
      db.issue.count({ where: { status: { not: "done" } } }),
      db.booking.count({ where: { status: "pending" } }),
      db.tenant.count({
        where: { active: true, contractEnd: { gte: now, lte: in30 } },
      }),
    ]);

  const overdue = unpaid.filter((i) => overdueInfo(i, 0).overdue).length;

  const items: Alert[] = [];
  if (overdue)
    items.push({
      key: "overdue",
      icon: "⚠️",
      label: "บิลเกินกำหนดชำระ",
      count: overdue,
      href: "/invoices",
      tone: "red",
    });
  if (waitingParcels)
    items.push({
      key: "parcels",
      icon: "📦",
      label: "พัสดุรอผู้เช่ามารับ",
      count: waitingParcels,
      href: "/parcels",
      tone: "amber",
    });
  if (openIssues)
    items.push({
      key: "issues",
      icon: "🔧",
      label: "งานแจ้งซ่อมค้างอยู่",
      count: openIssues,
      href: "/issues",
      tone: "amber",
    });
  if (pendingBookings)
    items.push({
      key: "bookings",
      icon: "📅",
      label: "การจองรอยืนยัน",
      count: pendingBookings,
      href: "/bookings",
      tone: "blue",
    });
  if (expiring)
    items.push({
      key: "contracts",
      icon: "📄",
      label: "สัญญาใกล้หมดอายุ (30 วัน)",
      count: expiring,
      href: "/tenants",
      tone: "amber",
    });

  const total = items.reduce((s, a) => s + a.count, 0);
  return { items, total };
}
