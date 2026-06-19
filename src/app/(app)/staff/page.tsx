import { db } from "@/lib/db";
import { requireAccess, currentUser } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui";
import StaffClient, { UserRow } from "./StaffClient";
import BuildingMatrix, { MatrixUser } from "./BuildingMatrix";

function parseAccess(s: string | null): string[] {
  if (!s) return [];
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
}

export default async function StaffPage() {
  await requireAccess("/staff");
  const me = await currentUser();
  const [users, distinctRooms] = await Promise.all([
    db.user.findMany({ orderBy: { name: "asc" } }),
    db.room.findMany({
      distinct: ["building"],
      select: { building: true },
      orderBy: { building: "asc" },
    }),
  ]);
  const buildings = distinctRooms.map((r) => r.building);

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isSelf: u.id === me?.id,
  }));

  const matrixUsers: MatrixUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    buildings: parseAccess(u.buildingAccess),
  }));

  return (
    <>
      <PageHeader
        title="ผู้ใช้งานระบบ"
        subtitle={`บัญชีเข้าใช้งาน ${rows.length} บัญชี`}
      />
      <StaffClient users={rows} />
      {rows.length === 0 && (
        <EmptyState
          icon="🧑‍💼"
          title="ยังไม่มีบัญชีผู้ใช้"
          hint="เพิ่มบัญชีเพื่อให้ทีมงานเข้าใช้งานระบบ"
        />
      )}
      <BuildingMatrix users={matrixUsers} buildings={buildings} />
    </>
  );
}
