import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { allowedBuildings } from "@/lib/permissions";
import { roomLabel, monthlyRent } from "@/lib/format";
import { fillContract } from "@/lib/contract";
import PrintButton from "./PrintButton";

function monthsBetween(a: Date | null, b: Date | null): number | null {
  if (!a || !b) return null;
  return (
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  );
}

export default async function ContractPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();

  const room = await db.room.findUnique({
    where: { id },
    include: { tenants: { where: { active: true }, take: 1 } },
  });
  if (!room) notFound();

  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);
  if (allowed && !allowed.includes(room.building)) notFound();

  const tenant = room.tenants[0];
  if (!tenant) notFound();

  // ข้อความสัญญา: ของห้องเอง หรือเทมเพลตเริ่มต้น
  let body = tenant.contractBody;
  if (!body) {
    const tpl = await db.contractTemplate.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: "asc" },
    });
    body = tpl?.body ?? "";
  }

  const tenantAddress = [
    tenant.address,
    tenant.subdistrict,
    tenant.district,
    tenant.province,
    tenant.postalCode,
  ]
    .filter(Boolean)
    .join(" ");

  const filled = fillContract(body, {
    dormName: user?.dormName ?? "",
    dormAddress: user?.address ?? null,
    tenantName: tenant.name,
    tenantAddress: tenantAddress || null,
    tenantIdCard: tenant.idCard,
    tenantPhone: tenant.phone,
    roomLabel: roomLabel(room.building, room.number),
    rent: monthlyRent(room),
    deposit: tenant.deposit,
    contractStart: tenant.contractStart,
    contractEnd: tenant.contractEnd,
    contractMonths: monthsBetween(tenant.contractStart, tenant.contractEnd),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <PrintButton />

      <div className="bg-white rounded-2xl border border-slate-200 p-8 print:border-0 print:rounded-none">
        <div className="text-center border-b border-slate-100 pb-4 mb-6">
          <div className="text-xl font-bold text-slate-800">สัญญาเช่าห้องพัก</div>
          <div className="text-sm text-slate-500 mt-1">
            {user?.dormName} — ห้อง {roomLabel(room.building, room.number)}
          </div>
        </div>

        {filled ? (
          <div
            className="prose prose-sm max-w-none text-slate-800 [&_p]:my-2"
            dangerouslySetInnerHTML={{ __html: filled }}
          />
        ) : (
          <p className="text-slate-400 text-sm">
            ยังไม่มีเทมเพลตสัญญา — สร้างได้ที่ ตั้งค่า › สัญญาเช่า
          </p>
        )}

        <div className="mt-10 grid grid-cols-2 gap-8 text-sm text-slate-600">
          <div className="text-center">
            <div className="border-t border-slate-300 pt-2 mt-10">
              ลงชื่อผู้ให้เช่า ({user?.name ?? "—"})
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-300 pt-2 mt-10">
              ลงชื่อผู้เช่า ({tenant.name})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
