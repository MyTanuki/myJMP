import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import {
  allowedBuildings,
  buildingWhere,
  roomBuildingWhereNullable,
} from "@/lib/permissions";
import { roomLabel } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";
import InventoryClient, { AssetRow } from "./InventoryClient";

export default async function InventoryPage() {
  const user = await currentUser();
  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);
  const [assets, rooms] = await Promise.all([
    db.asset.findMany({
      where: roomBuildingWhereNullable(allowed),
      orderBy: { createdAt: "desc" },
      include: { room: true },
    }),
    db.room.findMany({
      where: buildingWhere(allowed),
      orderBy: [{ building: "asc" }, { floor: "asc" }, { number: "asc" }],
    }),
  ]);

  const rows: AssetRow[] = assets.map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category,
    quantity: a.quantity,
    condition: a.condition,
    note: a.note,
    roomId: a.roomId,
    roomNumber: a.room ? roomLabel(a.room.building, a.room.number) : null,
  }));

  const broken = rows.filter((r) => r.condition === "broken").length;

  return (
    <>
      <PageHeader
        title="ทรัพย์สิน"
        subtitle={`ทั้งหมด ${rows.length} รายการ${broken ? ` · ชำรุด ${broken}` : ""}`}
      />
      <InventoryClient
        assets={rows}
        rooms={rooms.map((r) => ({ id: r.id, number: roomLabel(r.building, r.number) }))}
      />
      {rows.length === 0 && (
        <EmptyState
          icon="🗄️"
          title="ยังไม่มีทรัพย์สิน"
          hint="บันทึกเฟอร์นิเจอร์และเครื่องใช้ของหอ"
        />
      )}
    </>
  );
}
