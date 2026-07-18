import { currentUser, requireAccess } from "@/lib/auth";
import { Card } from "@/components/ui";
import { updateInfo } from "./actions";
import { Section, Field, TextArea, DaySelect, SaveButton } from "./ui";

export default async function SettingsInfoPage() {
  await requireAccess("/settings");
  const user = await currentUser();
  if (!user) return null;

  return (
    <div className="max-w-xl space-y-4">
      <Section title="ข้อมูลหอพัก">
        <form action={updateInfo} className="space-y-4">
          <Field label="ชื่อเจ้าของหอ" name="name" defaultValue={user.name} />
          <Field
            label="ชื่อหอพัก"
            name="dormName"
            defaultValue={user.dormName}
          />
          <TextArea
            label="ที่อยู่หอพัก"
            name="address"
            defaultValue={user.address ?? ""}
          />
          <Field
            label="เบอร์โทรติดต่อหอพัก"
            name="phone"
            type="tel"
            defaultValue={user.phone ?? ""}
          />
          <div className="grid grid-cols-2 gap-3">
            <DaySelect
              label="ทำบิลทุกวันที่"
              name="billDay"
              defaultValue={user.billDay}
            />
            <DaySelect
              label="กำหนดชำระภายในวันที่"
              name="dueDay"
              defaultValue={user.dueDay}
            />
          </div>
          <p className="text-xs text-slate-400">
            “กำหนดชำระภายในวันที่” จะถูกตั้งเป็นวันครบกำหนดอัตโนมัติตอนออกบิล
          </p>
          <SaveButton />
        </form>
      </Section>

      <Card className="p-6">
        <div className="text-sm text-slate-500">
          อีเมลที่ใช้เข้าระบบ:{" "}
          <span className="font-medium text-slate-700">{user.email}</span>
        </div>
      </Card>
    </div>
  );
}
