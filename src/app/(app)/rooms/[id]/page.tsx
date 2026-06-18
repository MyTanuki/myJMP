import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { calcInvoice, overdueInfo } from "@/lib/format";
import RoomDetail, { RoomDetailData } from "./RoomDetail";

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();

  const room = await db.room.findUnique({
    where: { id },
    include: {
      tenants: {
        where: { active: true },
        take: 1,
        include: { moveInItems: true },
      },
      invoices: { orderBy: { period: "desc" }, include: { items: true } },
      assets: { orderBy: { createdAt: "desc" } },
      issues: { orderBy: [{ status: "asc" }, { createdAt: "desc" }] },
      bookings: { orderBy: { date: "desc" } },
    },
  });
  if (!room) notFound();

  const lateFeePerDay = user?.lateFeePerDay ?? 0;
  const t = room.tenants[0] ?? null;

  const data: RoomDetailData = {
    id: room.id,
    building: room.building,
    number: room.number,
    name: room.name,
    floor: room.floor,
    type: room.type,
    basePrice: room.basePrice,
    tenant: t
      ? {
          id: t.id,
          name: t.name,
          phone: t.phone,
          idCard: t.idCard,
          vehiclePlate: t.vehiclePlate,
          address: t.address,
          deposit: t.deposit,
          depositPaid: t.depositPaid,
          moveInWater: t.moveInWater,
          moveInElec: t.moveInElec,
          contractNote: t.contractNote,
          contractStart: t.contractStart?.toISOString() ?? null,
          contractEnd: t.contractEnd?.toISOString() ?? null,
          moveInItems: t.moveInItems.map((m) => ({
            label: m.label,
            amount: m.amount,
          })),
        }
      : null,
    invoices: room.invoices.map((inv) => {
      const c = calcInvoice(inv);
      const od = overdueInfo(inv, lateFeePerDay);
      return {
        id: inv.id,
        period: inv.period,
        status: inv.status,
        total: c.total + od.lateFee,
        overdue: od.overdue,
      };
    }),
    assets: room.assets.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      quantity: a.quantity,
      condition: a.condition,
    })),
    issues: room.issues.map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      priority: i.priority,
      createdAt: i.createdAt.toISOString(),
    })),
    bookings: room.bookings.map((b) => ({
      id: b.id,
      name: b.name,
      phone: b.phone,
      status: b.status,
      date: b.date.toISOString(),
      deposit: b.deposit,
    })),
    dormName: user?.dormName ?? "",
  };

  return <RoomDetail data={data} />;
}
