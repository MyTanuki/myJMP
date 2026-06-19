import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import {
  allowedBuildings,
  buildingWhere,
  roomBuildingWhere,
} from "@/lib/permissions";
import { roomLabel } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";
import TenantsClient, { TenantRow, RoomOption } from "./TenantsClient";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ assign?: string }>;
}) {
  const sp = await searchParams;
  const user = await currentUser();
  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);
  const [tenants, rooms] = await Promise.all([
    db.tenant.findMany({
      where: roomBuildingWhere(allowed),
      orderBy: [
        { active: "desc" },
        { room: { building: "asc" } },
        { room: { floor: "asc" } },
        { room: { number: "asc" } },
      ],
      include: { room: true },
    }),
    db.room.findMany({
      where: buildingWhere(allowed),
      orderBy: [{ building: "asc" }, { floor: "asc" }, { number: "asc" }],
    }),
  ]);

  const rows: TenantRow[] = tenants.map((t) => ({
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
    moveInDate: t.moveInDate.toISOString(),
    contractStart: t.contractStart?.toISOString() ?? null,
    contractEnd: t.contractEnd?.toISOString() ?? null,
    active: t.active,
    roomId: t.roomId,
    roomNumber: roomLabel(t.room.building, t.room.number),
  }));

  const roomOptions: RoomOption[] = rooms.map((r) => ({
    id: r.id,
    number: roomLabel(r.building, r.number),
  }));

  const assign = sp.assign
    ? roomOptions.find((r) => r.id === sp.assign)
    : undefined;

  const activeCount = rows.filter((r) => r.active).length;

  return (
    <>
      <PageHeader
        title="ผู้เช่า"
        subtitle={`พักอยู่ ${activeCount} คน · ทั้งหมด ${rows.length} ราย`}
      />
      <TenantsClient
        tenants={rows}
        rooms={roomOptions}
        assignRoom={assign ? { id: assign.id, label: assign.number } : undefined}
      />
      {rows.length === 0 && (
        <EmptyState
          icon="👤"
          title="ยังไม่มีผู้เช่า"
          hint="เพิ่มห้องก่อน แล้วจึงเพิ่มผู้เช่าเข้าห้อง"
        />
      )}
    </>
  );
}
