import Link from "next/link";
import { getAlerts } from "@/lib/alerts";
import { PageHeader, Card, EmptyState } from "@/components/ui";

const TONE: Record<string, string> = {
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-brand-50 text-brand-700",
};

export default async function AlertsPage() {
  const { items, total } = await getAlerts();

  return (
    <>
      <PageHeader
        title="การแจ้งเตือน"
        subtitle={total ? `มี ${total} รายการที่ต้องจัดการ` : "ทุกอย่างเรียบร้อย"}
      />

      {items.length === 0 ? (
        <EmptyState
          icon="✅"
          title="ไม่มีการแจ้งเตือน"
          hint="ไม่มีบิลค้าง พัสดุค้าง หรืองานซ่อมที่รอดำเนินการ"
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Link
              key={a.key}
              href={a.href}
              className="block bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-brand-200 hover:shadow transition flex items-center gap-3"
            >
              <span
                className={`grid place-items-center w-11 h-11 rounded-xl shrink-0 ${TONE[a.tone]}`}
              >
                {a.icon}
              </span>
              <div className="flex-1 font-medium text-slate-800">{a.label}</div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${TONE[a.tone]}`}
              >
                {a.count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
