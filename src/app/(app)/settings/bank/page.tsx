import { currentUser, requireAccess } from "@/lib/auth";
import { updateBank } from "../actions";
import { Section, Field, SaveButton } from "../ui";

export default async function SettingsBankPage() {
  await requireAccess("/settings");
  const user = await currentUser();
  if (!user) return null;

  return (
    <div className="max-w-xl space-y-4">
      <Section title="บัญชีรับชำระเงิน">
        <form action={updateBank} className="space-y-4">
          <Field
            label="ธนาคาร"
            name="bankName"
            defaultValue={user.bankName ?? ""}
          />
          <Field
            label="ชื่อบัญชี"
            name="bankAccountName"
            defaultValue={user.bankAccountName ?? ""}
          />
          <Field
            label="เลขที่บัญชี"
            name="bankAccountNo"
            defaultValue={user.bankAccountNo ?? ""}
          />
          <p className="text-xs text-slate-400">
            ข้อมูลนี้จะแสดงในใบแจ้งค่าเช่าเพื่อให้ผู้เช่าโอนชำระ
          </p>
          <SaveButton />
        </form>
      </Section>
    </div>
  );
}
