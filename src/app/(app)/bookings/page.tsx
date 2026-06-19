import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import {
  allowedBuildings,
  buildingWhere,
  roomBuildingWhereNullable,
} from "@/lib/permissions";
import { roomLabel } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";
import BookingsClient, { BookingRow } from "./BookingsClient";

export default async function BookingsPage() {
  const user = await currentUser();
  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);
  const [bookings, rooms] = await Promise.all([
    db.booking.findMany({
      where: roomBuildingWhereNullable(allowed),
      orderBy: { date: "desc" },
      include: { room: true },
    }),
    db.room.findMany({
      where: buildingWhere(allowed),
      orderBy: [{ building: "asc" }, { floor: "asc" }, { number: "asc" }],
    }),
  ]);

  const rows: BookingRow[] = bookings.map((b) => ({
    id: b.id,
    name: b.name,
    phone: b.phone,
    date: b.date.toISOString(),
    status: b.status,
    deposit: b.deposit,
    note: b.note,
    roomId: b.roomId,
    roomNumber: b.room ? roomLabel(b.room.building, b.room.number) : null,
  }));

  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <>
      <PageHeader
        title="การจอง"
        subtitle={`รอยืนยัน ${pending} · ทั้งหมด ${rows.length} รายการ`}
      />
      <BookingsClient
        bookings={rows}
        rooms={rooms.map((r) => ({ id: r.id, number: roomLabel(r.building, r.number) }))}
      />
      {rows.length === 0 && (
        <EmptyState
          icon="📅"
          title="ยังไม่มีการจอง"
          hint="กด “เพิ่มการจอง” เพื่อบันทึกผู้สนใจเช่าห้อง"
        />
      )}
    </>
  );
}
