import { db } from "@/lib/db";
import { requireAccess } from "@/lib/auth";
import { PageHeader, Card, Badge } from "@/components/ui";
import { baht } from "@/lib/format";

const PLANS = [
  { key: "free", name: "เริ่มต้น", price: 0, rooms: 10, features: ["จัดการห้อง/ผู้เช่า", "ออกบิล/มิเตอร์", "รายรับ-รายจ่าย"] },
  { key: "pro", name: "โปร", price: 390, rooms: 50, features: ["ทุกอย่างในแพ็กเกจเริ่มต้น", "รายงาน & วิเคราะห์", "พนักงานหลายคน", "พอร์ทัลผู้เช่า"] },
  { key: "max", name: "แม็กซ์", price: 990, rooms: 9999, features: ["ทุกอย่างในแพ็กเกจโปร", "ห้องไม่จำกัด", "ประกาศห้องว่างสาธารณะ", "ซัพพอร์ตด่วน"] },
];

// แพ็กเกจปัจจุบัน (ตัวอย่างสำหรับเดโม)
const CURRENT = "pro";

export default async function SubscriptionPage() {
  await requireAccess("/subscription");
  const [roomCount, tenantCount] = await Promise.all([
    db.room.count(),
    db.tenant.count({ where: { active: true } }),
  ]);

  const current = PLANS.find((p) => p.key === CURRENT)!;
  const usagePct = Math.min(
    100,
    Math.round((roomCount / current.rooms) * 100)
  );

  return (
    <>
      <PageHeader title="แพ็กเกจ" subtitle="แพ็กเกจการใช้งานและการใช้ทรัพยากร" />

      <Card className="p-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-slate-400">แพ็กเกจปัจจุบัน</div>
            <div className="text-xl font-bold text-slate-800">
              {current.name}{" "}
              <span className="text-slate-400 text-base font-normal">
                · {current.price ? `${baht(current.price)}/เดือน` : "ฟรี"}
              </span>
            </div>
          </div>
          <Badge tone="green">กำลังใช้งาน</Badge>
        </div>
        <div className="text-sm text-slate-500 mb-1">
          ห้องพัก {roomCount} / {current.rooms === 9999 ? "ไม่จำกัด" : current.rooms} ·
          ผู้เช่า {tenantCount} คน
        </div>
        <div className="h-3 rounded-full overflow-hidden bg-slate-100">
          <div
            className="bg-brand-500 h-full"
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-3">
        {PLANS.map((p) => {
          const isCurrent = p.key === CURRENT;
          return (
            <Card
              key={p.key}
              className={`p-5 ${isCurrent ? "ring-2 ring-brand-400" : ""}`}
            >
              <div className="font-bold text-slate-800">{p.name}</div>
              <div className="text-2xl font-bold text-brand-700 mt-1">
                {p.price ? baht(p.price) : "ฟรี"}
                {p.price ? (
                  <span className="text-sm text-slate-400 font-normal">
                    {" "}
                    /เดือน
                  </span>
                ) : null}
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={isCurrent}
                className={`mt-4 w-full py-2.5 rounded-xl font-medium transition ${
                  isCurrent
                    ? "bg-slate-100 text-slate-400 cursor-default"
                    : "bg-brand-600 hover:bg-brand-700 text-white"
                }`}
              >
                {isCurrent ? "แพ็กเกจปัจจุบัน" : "เลือกแพ็กเกจนี้"}
              </button>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 mt-4">
        * หน้านี้เป็นตัวอย่างสำหรับโปรเจกต์ส่วนตัว ยังไม่มีการชำระเงินจริง
      </p>
    </>
  );
}
