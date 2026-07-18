import { db } from "@/lib/db";
import { currentUser, requireAccess } from "@/lib/auth";
import { allowedBuildings } from "@/lib/permissions";
import { updateRates } from "../actions";
import { Section, Field, SaveButton } from "../ui";
import RatesClient from "./RatesClient";

export default async function SettingsRatesPage() {
  await requireAccess("/settings");
  const user = await currentUser();
  if (!user) return null;

  const allowed = allowedBuildings(user.role, user.buildingAccess);
  const rooms = await db.room.findMany({
    where: allowed ? { building: { in: allowed } } : {},
    orderBy: [
      { building: "asc" },
      { floor: "asc" },
      { sortOrder: "asc" },
      { number: "asc" },
    ],
    select: {
      id: true,
      building: true,
      floor: true,
      number: true,
      waterRate: true,
      elecRate: true,
    },
  });

  return (
    <div className="max-w-3xl space-y-4">
      <Section title="อัตรากลาง (ค่าเริ่มต้นทุกห้อง)">
        <form action={updateRates} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="ค่าน้ำ (บาท/หน่วย)"
              name="waterRate"
              type="number"
              defaultValue={String(user.waterRate)}
            />
            <Field
              label="ค่าไฟ (บาท/หน่วย)"
              name="elecRate"
              type="number"
              defaultValue={String(user.elecRate)}
            />
          </div>
          <p className="text-xs text-slate-400">
            ห้องที่ไม่ได้กำหนดอัตราเอง จะใช้อัตรากลางนี้
          </p>
          <SaveButton />
        </form>
      </Section>

      <RatesClient
        rooms={rooms}
        defaultWater={user.waterRate}
        defaultElec={user.elecRate}
      />
    </div>
  );
}
