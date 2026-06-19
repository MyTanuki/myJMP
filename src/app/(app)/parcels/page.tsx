import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import {
  allowedBuildings,
  buildingWhere,
  roomBuildingWhereNullable,
} from "@/lib/permissions";
import { roomLabel } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import ParcelsClient, { ParcelRow, RoomOption } from "./ParcelsClient";

export default async function ParcelsPage() {
  const user = await currentUser();
  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);
  const [parcels, rooms] = await Promise.all([
    db.parcel.findMany({
      where: roomBuildingWhereNullable(allowed),
      orderBy: [{ pickedUp: "asc" }, { arrivedAt: "desc" }],
      include: { room: true },
    }),
    db.room.findMany({
      where: buildingWhere(allowed),
      orderBy: [{ building: "asc" }, { floor: "asc" }, { number: "asc" }],
    }),
  ]);

  const rows: ParcelRow[] = parcels.map((p) => ({
    id: p.id,
    recipient: p.recipient,
    carrier: p.carrier,
    arrivedAt: p.arrivedAt.toISOString(),
    pickedUp: p.pickedUp,
    pickedUpAt: p.pickedUpAt?.toISOString() ?? null,
    note: p.note,
    roomNumber: p.room ? roomLabel(p.room.building, p.room.number) : null,
  }));

  const waiting = rows.filter((r) => !r.pickedUp).length;

  return (
    <>
      <PageHeader
        title="พัสดุ"
        subtitle={`รอรับ ${waiting} ชิ้น · ทั้งหมด ${rows.length} ชิ้น`}
      />
      <ParcelsClient
        parcels={rows}
        rooms={rooms.map((r) => ({ id: r.id, number: roomLabel(r.building, r.number) }))}
      />
    </>
  );
}
