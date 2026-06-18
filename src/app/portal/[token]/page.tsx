import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { baht, calcInvoice, overdueInfo, thaiDate, thaiMonth } from "@/lib/format";

export const metadata = { title: "บิลห้องพักของฉัน" };

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const room = await db.room.findFirst({
    where: { publicToken: token },
    include: {
      tenants: { where: { active: true }, take: 1 },
      invoices: { orderBy: { period: "desc" }, take: 6, include: { items: true } },
    },
  });
  if (!room) notFound();

  const owner = await db.user.findFirst();
  const lateFeePerDay = owner?.lateFeePerDay ?? 0;
  const tenant = room.tenants[0] ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand-600 text-white">
        <div className="max-w-lg mx-auto px-5 py-8">
          <div className="text-sm text-brand-50">{owner?.dormName}</div>
          <h1 className="text-2xl font-bold mt-1">
            อาคาร {room.building} · ห้อง {room.number}
          </h1>
          {tenant && <p className="text-brand-50 mt-1">{tenant.name}</p>}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-3">
        <h2 className="font-semibold text-slate-700">บิลย้อนหลัง</h2>
        {room.invoices.length === 0 && (
          <p className="text-slate-400 text-sm">ยังไม่มีบิล</p>
        )}
        {room.invoices.map((inv) => {
          const c = calcInvoice(inv);
          const od = overdueInfo(inv, lateFeePerDay);
          const total = c.total + od.lateFee;
          return (
            <div
              key={inv.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-slate-800">
                  {thaiMonth(inv.period)}
                </div>
                {inv.status === "paid" ? (
                  <span className="text-emerald-600 text-sm font-medium">
                    ชำระแล้ว
                  </span>
                ) : od.overdue ? (
                  <span className="text-red-600 text-sm font-medium">
                    เกินกำหนด {od.daysLate} วัน
                  </span>
                ) : (
                  <span className="text-amber-600 text-sm font-medium">
                    ค้างชำระ
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                น้ำ {c.waterUnits} หน่วย · ไฟ {c.elecUnits} หน่วย
                {inv.dueDate ? ` · กำหนด ${thaiDate(inv.dueDate)}` : ""}
              </div>
              <div className="text-xl font-bold text-brand-700 mt-2">
                {baht(total)}
              </div>
            </div>
          );
        })}

        {(owner?.bankName || owner?.bankAccountNo) && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-sm">
            <div className="font-medium text-slate-700 mb-1">ช่องทางชำระเงิน</div>
            <div className="text-slate-600">
              {owner?.bankName}
              {owner?.bankAccountName ? ` · ${owner.bankAccountName}` : ""}
            </div>
            {owner?.bankAccountNo && (
              <div className="text-slate-600">
                เลขที่บัญชี {owner.bankAccountNo}
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 pt-4">
          ลิงก์นี้สำหรับผู้เช่าห้อง {room.number} เท่านั้น
        </p>
      </main>
    </div>
  );
}
