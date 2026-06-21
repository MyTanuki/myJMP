import { db } from "@/lib/db";
import { currentUser, requireAccess } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import {
  updateSettings,
  updateBillHeader,
  updateBank,
  updatePenalty,
} from "./actions";
import PresetsClient from "./PresetsClient";
import DirtySaveButton from "@/components/SaveButton";

export default async function SettingsPage() {
  await requireAccess("/settings");
  const user = await currentUser();
  if (!user) return null;

  const presets = await db.servicePreset.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader title="ตั้งค่า" subtitle="ข้อมูลหอพัก บิล และการรับชำระ" />

      <div className="max-w-xl space-y-4">
        {/* หอพัก + อัตรา */}
        <Section title="ข้อมูลหอพักและอัตรากลาง">
          <form action={updateSettings} className="space-y-4">
            <Field label="ชื่อเจ้าของหอ" name="name" defaultValue={user.name} />
            <Field
              label="ชื่อหอพัก"
              name="dormName"
              defaultValue={user.dormName}
            />
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
              อัตรานี้ใช้เป็นค่าเริ่มต้นเวลาออกบิล (ตั้งรายห้องได้ในหน้าห้องพัก)
            </p>
            <SaveButton />
          </form>
        </Section>

        {/* หัวบิล */}
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
              label="ที่อยู่หอพัก"
              name="address"
              defaultValue={user.address ?? ""}
            />
            <TextArea
              label="ข้อความท้ายบิล"
              name="billNote"
              defaultValue={user.billNote ?? ""}
            />
            <SaveButton />
          </form>
        </Section>

        {/* บัญชีรับชำระ */}
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

        {/* ค่าปรับ */}
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

        {/* รายการบริการ */}
        <Section title="รายการบริการ / ค่าใช้จ่ายที่ใช้บ่อย">
          <PresetsClient presets={presets} />
        </Section>

        <Card className="p-6">
          <div className="text-sm text-slate-500">
            อีเมลที่ใช้เข้าระบบ:{" "}
            <span className="font-medium text-slate-700">{user.email}</span>
          </div>
        </Card>
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-slate-800 mb-4">{title}</h2>
      {children}
    </Card>
  );
}

function SaveButton() {
  return (
    <DirtySaveButton className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-xl">
      บันทึก
    </DirtySaveButton>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={2}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
      />
    </label>
  );
}
