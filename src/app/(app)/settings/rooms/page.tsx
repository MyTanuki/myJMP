import { db } from "@/lib/db";
import { requireAccess } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import RoomGridClient, { GridRow } from "./RoomGridClient";

export default async function RoomSetupPage() {
  await requireAccess("/settings");

  const rooms = await db.room.findMany({
    orderBy: [{ building: "asc" }, { sortOrder: "asc" }, { floor: "asc" }, { number: "asc" }],
  });

  const initial: GridRow[] = rooms.map((r) => ({
    id: r.id,
    building: r.building,
    floor: r.floor,
    number: r.number,
    name: r.name ?? "",
  }));

  return (
    <>
      <PageHeader
        title="จัดการห้องพัก"
        subtitle="กำหนดอาคาร ชั้น เลขห้อง และชื่อห้อง"
      />
      <Card className="p-6 max-w-3xl">
        <RoomGridClient initial={initial} />
      </Card>
    </>
  );
}
