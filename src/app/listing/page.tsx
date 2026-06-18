import { db } from "@/lib/db";
import { baht, monthlyRent, roomLabel } from "@/lib/format";

export const metadata = {
  title: "ห้องว่างให้เช่า",
};

export default async function ListingPage() {
  const [owner, rooms] = await Promise.all([
    db.user.findFirst(),
    db.room.findMany({
      orderBy: [{ floor: "asc" }, { number: "asc" }],
      include: { tenants: { where: { active: true }, take: 1 } },
    }),
  ]);

  const vacant = rooms.filter((r) => r.tenants.length === 0);
  const dormName = owner?.dormName ?? "หอพัก";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand-600 text-white">
        <div className="max-w-4xl mx-auto px-5 py-12">
          <h1 className="text-3xl font-bold">{dormName}</h1>
          {owner?.address && (
            <p className="mt-2 text-brand-50 whitespace-pre-line">
              {owner.address}
            </p>
          )}
          <p className="mt-4 inline-block bg-white/15 rounded-full px-4 py-1.5 text-sm">
            ห้องว่าง {vacant.length} ห้อง พร้อมเข้าอยู่
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-8">
        {vacant.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-4xl mb-3">🏠</div>
            <p className="font-medium text-slate-500">ขณะนี้ห้องเต็มทุกห้อง</p>
            <p className="text-sm mt-1">โปรดติดต่อสอบถามคิวว่างกับทางหอพัก</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vacant.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="h-28 bg-gradient-to-br from-brand-100 to-brand-50 grid place-items-center text-3xl font-bold text-brand-600">
                  {roomLabel(r.building, r.number)}
                </div>
                <div className="p-4">
                  <div className="font-semibold text-slate-800">
                    ห้อง {r.number}
                    <span className="text-slate-400 font-normal">
                      {" "}
                      · อาคาร {r.building} · ชั้น {r.floor}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">{r.type}</div>
                  <div className="mt-3 text-xl font-bold text-brand-700">
                    {baht(monthlyRent(r))}
                    <span className="text-sm text-slate-400 font-normal">
                      {" "}
                      /เดือน
                    </span>
                  </div>
                  {r.note && (
                    <p className="text-sm text-slate-400 mt-2">{r.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-sm text-slate-400 mt-10">
          สนใจเข้าชมห้อง โปรดติดต่อ {owner?.name ?? "เจ้าของหอพัก"}
        </p>
      </main>
    </div>
  );
}
