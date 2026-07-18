import { currentUser, requireAccess } from "@/lib/auth";
import { updateBillHeader } from "../actions";
import { Section, Field, TextArea, SaveButton } from "../ui";

export default async function SettingsBillPage() {
  await requireAccess("/settings");
  const user = await currentUser();
  if (!user) return null;

  return (
    <div className="max-w-xl space-y-4">
      <Section title="ข้อมูลออกบิล (หัวบิล)">
        <form action={updateBillHeader} className="space-y-4">
          <Field
            label="ประเภทกิจการ"
            name="businessType"
            defaultValue={user.businessType ?? ""}
          />
          <Field
            label="เลขประจำตัวผู้เสียภาษี"
            name="taxId"
            defaultValue={user.taxId ?? ""}
          />
          <TextArea
            label="ข้อความท้ายบิล"
            name="billNote"
            defaultValue={user.billNote ?? ""}
          />
          <SaveButton />
        </form>
      </Section>
    </div>
  );
}
