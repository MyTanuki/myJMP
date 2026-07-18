import { Card } from "@/components/ui";
import DirtySaveButton from "@/components/SaveButton";

export function Section({
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

export function SaveButton() {
  return (
    <DirtySaveButton className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-xl">
      บันทึก
    </DirtySaveButton>
  );
}

export function Field({
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

export function TextArea({
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

// เลือกวันที่ของเดือน 1-31 (ค่าว่าง = ไม่กำหนด)
export function DaySelect({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: number | null;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition bg-white"
      >
        <option value="">ไม่กำหนด</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            วันที่ {d}
          </option>
        ))}
      </select>
    </label>
  );
}
