import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import {
  allowedBuildings,
  buildingWhere,
  roomBuildingWhereNullable,
} from "@/lib/permissions";
import { roomLabel } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import IssuesClient, { IssueRow } from "./IssuesClient";

export default async function IssuesPage() {
  const user = await currentUser();
  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);
  const [issues, rooms] = await Promise.all([
    db.issue.findMany({
      where: roomBuildingWhereNullable(allowed),
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
    status: i.status,
    priority: i.priority,
    createdAt: i.createdAt.toISOString(),
    resolvedAt: i.resolvedAt?.toISOString() ?? null,
    roomId: i.roomId,
    roomNumber: i.room ? roomLabel(i.room.building, i.room.number) : null,
  }));

  const openCount = rows.filter((r) => r.status !== "done").length;

  return (
    <>
      <PageHeader
        title="แจ้งซ่อม"
        subtitle={`ค้างอยู่ ${openCount} รายการ · ทั้งหมด ${rows.length} รายการ`}
      />
      <IssuesClient
        issues={rows}
        rooms={rooms.map((r) => ({ id: r.id, number: roomLabel(r.building, r.number) }))}
      />
    </>
  );
}
