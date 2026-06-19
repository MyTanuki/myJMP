import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import {
  allowedBuildings,
  buildingWhere,
  roomBuildingWhere,
  roomBuildingWhereNullable,
} from "@/lib/permissions";
import { roomLabel } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";
import VehiclesClient, { VehicleRow } from "./VehiclesClient";

export default async function VehiclesPage() {
  const user = await currentUser();
  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);
  const [vehicles, rooms, tenants] = await Promise.all([
    db.vehicle.findMany({
      where: roomBuildingWhereNullable(allowed),
      orderBy: { createdAt: "desc" },
      include: { room: true, tenant: true },
    }),
    db.room.findMany({
      where: buildingWhere(allowed),
      orderBy: [{ building: "asc" }, { floor: "asc" }, { number: "asc" }],
    }),
    db.tenant.findMany({
      where: { active: true, ...roomBuildingWhere(allowed) },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows: VehicleRow[] = vehicles.map((v) => ({
    id: v.id,
    plate: v.plate,
    kind: v.kind,
    brand: v.brand,
    color: v.color,
    note: v.note,
    roomId: v.roomId,
    roomNumber: v.room ? roomLabel(v.room.building, v.room.number) : null,
    tenantId: v.tenantId,
    tenantName: v.tenant?.name ?? null,
  }));

  return (
    <>
      <PageHeader
        title="ยานพาหนะ"
        subtitle={`ลงทะเบียน ${rows.length} คัน`}
      />
      <VehiclesClient
        vehicles={rows}
        rooms={rooms.map((r) => ({ id: r.id, number: roomLabel(r.building, r.number) }))}
        tenants={tenants.map((t) => ({ id: t.id, name: t.name }))}
      />
      {rows.length === 0 && (
        <EmptyState
          icon="🚗"
          title="ยังไม่มีรถลงทะเบียน"
          hint="บันทึกทะเบียนรถของผู้เช่าเพื่อจัดการที่จอด"
        />
      )}
    </>
  );
}
