import { currentUser, requireAccess } from "@/lib/auth";
import { updatePenalty } from "../actions";
import { Section, Field, SaveButton } from "../ui";

export default async function SettingsPenaltyPage() {
  await requireAccess("/settings");
  const user = await currentUser();
  if (!user) return null;

  return (
    <div className="max-w-xl space-y-4">
      <Section title="ค่าปรับชำระล่าช้า">
        <form action={updatePenalty} className="space-y-4">
          <Field
            label="ค่าปรับ (บาท/วัน)"
            name="lateFeePerDay"
            type="number"
            defaultValue={String(user.lateFeePerDay)}
          />
          <p className="text-xs text-slate-400">
            ใช้อ้างอิงคำนวณค่าปรับเมื่อชำระเกินกำหนด
          </p>
          <SaveButton />
        </form>
      </Section>
    </div>
  );
}
