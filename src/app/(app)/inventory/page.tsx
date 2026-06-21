import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import {
  allowedBuildings,
  buildingWhere,
  roomBuildingWhereNullable,
} from "@/lib/permissions";
import { roomLabel } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";
import BackToRoom from "@/components/BackToRoom";
import InventoryClient, { AssetRow } from "./InventoryClient";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const sp = await searchParams;
  const roomId = sp.room;
  const user = await currentUser();
  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);
  const [assets, rooms] = await Promise.all([
    db.asset.findMany({
      where: roomId ? { roomId } : roomBuildingWhereNullable(allowed),
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

  const backRoom = roomId ? rooms.find((r) => r.id === roomId) : undefined;

  return (
    <>
      {backRoom && (
        <BackToRoom
          id={backRoom.id}
          label={roomLabel(backRoom.building, backRoom.number)}
        />
      )}
      <PageHeader
        title="ทรัพย์สิน"
        subtitle={`ทั้งหมด ${rows.length} รายการ${broken ? ` · ชำรุด ${broken}` : ""}`}
      />
      <InventoryClient
        assets={rows}
        rooms={rooms.map((r) => ({ id: r.id, number: roomLabel(r.building, r.number) }))}
        lockRoom={
          backRoom
            ? { id: backRoom.id, number: roomLabel(backRoom.building, backRoom.number) }
            : undefined
        }
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
