import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { allowedBuildings } from "@/lib/permissions";
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

  // กันเข้าถึงห้องในอาคารที่ไม่มีสิทธิ์
  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);
  if (allowed && !allowed.includes(room.building)) notFound();

  const lateFeePerDay = user?.lateFeePerDay ?? 0;
  const t = room.tenants[0] ?? null;

  // เทมเพลตสัญญาเริ่มต้น — ใช้เมื่อห้องยังไม่มีข้อความสัญญาของตัวเอง
  const defaultTemplate = await db.contractTemplate.findFirst({
    where: { isDefault: true },
    orderBy: { createdAt: "asc" },
  });

  // รายชื่อผู้เช่าทั้งหมด สำหรับ dropdown "เลือกข้อมูลจากผู้เช่า" ในฟอร์มสัญญา
  const allTenants = await db.tenant.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      idCard: true,
      address: true,
      subdistrict: true,
      district: true,
      province: true,
      postalCode: true,
    },
  });

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
          subdistrict: t.subdistrict,
          district: t.district,
          province: t.province,
          postalCode: t.postalCode,
          deposit: t.deposit,
          depositPaid: t.depositPaid,
          moveInDate: t.moveInDate.toISOString(),
          moveInWater: t.moveInWater,
          moveInElec: t.moveInElec,
          contractNote: t.contractNote,
          contractBody: t.contractBody,
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
        dueDate: inv.dueDate?.toISOString() ?? null,
        overdue: od.overdue,
        daysLate: od.daysLate,
        lateFee: od.lateFee,
        rent: inv.rent,
        prevWater: inv.prevWater,
        currWater: inv.currWater,
        waterRate: inv.waterRate,
        prevElec: inv.prevElec,
        currElec: inv.currElec,
        elecRate: inv.elecRate,
        waterMeterChanged: inv.waterMeterChanged,
        waterOldEnd: inv.waterOldEnd,
        elecMeterChanged: inv.elecMeterChanged,
        elecOldEnd: inv.elecOldEnd,
        other: inv.other,
        otherNote: inv.otherNote,
        items: inv.items.map((it) => ({ label: it.label, amount: it.amount })),
        total: c.total + od.lateFee,
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
    tenantOptions: allTenants,
    defaultContractBody: defaultTemplate?.body ?? "",
  };

  return <RoomDetail data={data} />;
}
