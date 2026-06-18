import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, EmptyState, Card } from "@/components/ui";
import { currentPeriod, monthlyRent } from "@/lib/format";
import RoomsClient, { RoomRow, RoomStatus } from "./RoomsClient";

export default async function RoomsPage() {
  const period = currentPeriod();

  const rooms = await db.room.findMany({
    orderBy: [
      { building: "asc" },
      { floor: "asc" },
      { sortOrder: "asc" },
      { number: "asc" },
    ],
    include: {
      tenants: { where: { active: true }, take: 1 },
      invoices: { where: { period }, take: 1 },
      issues: { where: { status: { not: "done" } }, select: { id: true }, take: 1 },
    },
  });

  const rows: RoomRow[] = rooms.map((r) => {
    const tenant = r.tenants[0]?.name ?? null;
    const invoice = r.invoices[0];
    let status: RoomStatus;
    if (!tenant) status = "vacant";
    else if (!invoice) status = "nobill";
    else if (invoice.status === "paid") status = "paid";
    else status = "unpaid";

    return {
      id: r.id,
      building: r.building,
      number: r.number,
      floor: r.floor,
      hasRepair: r.issues.length > 0,
      type: r.type,
      basePrice: r.basePrice,
      rentFurniture: r.rentFurniture,
      rentCommon: r.rentCommon,
      rentAircon: r.rentAircon,
      rentFridge: r.rentFridge,
      rentTv: r.rentTv,
      rentDiscount: r.rentDiscount,
      rentTotal: monthlyRent(r),
      waterRate: r.waterRate,
      elecRate: r.elecRate,
      note: r.note,
      publicToken: r.publicToken,
      tenant,
      status,
    };
  });

  const vacant = rows.filter((r) => r.status === "vacant").length;

  return (
    <>
      <PageHeader
        title="ผังห้อง"
        subtitle={`ทั้งหมด ${rows.length} ห้อง · ว่าง ${vacant} ห้อง`}
      />
      <RoomsClient rooms={rows} />
      {rows.length === 0 && (
        <EmptyState
          icon="🏠"
          title="ยังไม่มีห้องพัก"
          hint="กด “เพิ่มห้อง” เพื่อเริ่มต้น"
        />
      )}

      <Card className="p-5 mt-6">
        <div className="font-semibold text-slate-800 mb-3">ทางลัด</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Quick href="/invoices" icon="🧾" label="ออกบิลเดือนนี้" />
          <Quick href="/tenants" icon="👤" label="เพิ่มผู้เช่า" />
          <Quick href="/settings/rooms" icon="🏗️" label="จัดการห้องพัก" />
          <Quick href="/settings" icon="⚙️" label="ตั้งค่าค่าน้ำ-ไฟ" />
        </div>
      </Card>
    </>
  );
}

function Quick({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/50 transition text-sm font-medium text-slate-600"
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
}
