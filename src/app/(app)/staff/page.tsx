import { db } from "@/lib/db";
import { requireAccess } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui";
import StaffClient, { StaffRow } from "./StaffClient";

export default async function StaffPage() {
  await requireAccess("/staff");
  const staff = await db.staff.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
  });

  const rows: StaffRow[] = staff.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    role: s.role,
    active: s.active,
  }));

  return (
    <>
      <PageHeader
        title="พนักงาน"
        subtitle={`ทีมงาน ${rows.filter((r) => r.active).length} คน`}
      />
      <StaffClient staff={rows} />
      {rows.length === 0 && (
        <EmptyState
          icon="🧑‍💼"
          title="ยังไม่มีพนักงาน"
          hint="เพิ่มทีมงานและกำหนดบทบาทการเข้าถึง"
        />
      )}
    </>
  );
}
