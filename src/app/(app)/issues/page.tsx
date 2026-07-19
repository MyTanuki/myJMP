import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import {
  allowedBuildings,
  buildingWhere,
  roomBuildingWhereNullable,
} from "@/lib/permissions";
import { roomLabel } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import BackToRoom from "@/components/BackToRoom";
import IssuesClient, { IssueRow } from "./IssuesClient";

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const sp = await searchParams;
  const roomId = sp.room;
  const user = await currentUser();
  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);
  const [issues, rooms] = await Promise.all([
    db.issue.findMany({
      where: roomId ? { roomId } : roomBuildingWhereNullable(allowed),
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { room: true },
    }),
    db.room.findMany({
      where: buildingWhere(allowed),
      orderBy: [{ building: "asc" }, { floor: "asc" }, { number: "asc" }],
    }),
  ]);

  const rows: IssueRow[] = issues.map((i) => ({
    id: i.id,
    title: i.title,
    detail: i.detail,
    type: i.type,
    status: i.status,
    priority: i.priority,
    appointmentDate: i.appointmentDate?.toISOString() ?? null,
    assignee: i.assignee,
    createdAt: i.createdAt.toISOString(),
    resolvedAt: i.resolvedAt?.toISOString() ?? null,
    roomId: i.roomId,
    roomNumber: i.room ? roomLabel(i.room.building, i.room.number) : null,
  }));

  const openCount = rows.filter((r) => r.status !== "done").length;

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
        title="การแจ้ง"
        subtitle={`ค้างอยู่ ${openCount} รายการ · ทั้งหมด ${rows.length} รายการ`}
      />
      <IssuesClient
        issues={rows}
        rooms={rooms.map((r) => ({ id: r.id, number: roomLabel(r.building, r.number) }))}
        lockRoom={
          backRoom
            ? { id: backRoom.id, number: roomLabel(backRoom.building, backRoom.number) }
            : undefined
        }
      />
    </>
  );
}
