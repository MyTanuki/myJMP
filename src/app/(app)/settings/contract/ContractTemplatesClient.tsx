"use client";

import { useState } from "react";
import Modal, { Input, Textarea } from "@/components/Modal";
import SaveButton from "@/components/SaveButton";
import { Badge } from "@/components/ui";
import { createTemplate, updateTemplate, deleteTemplate } from "./actions";

export type TemplateRow = {
  id: string;
  name: string;
  body: string;
  isDefault: boolean;
};

// ตัวแปรที่ใช้ในเนื้อหาสัญญา (จะถูกแทนค่าตอนพิมพ์สัญญา — ฟีเจอร์พิมพ์ทำในขั้นถัดไป)
const FIELDS = [
  "{{tenantName}}",
  "{{tenantPhone}}",
  "{{tenantIdCard}}",
  "{{tenantAddress}}",
  "{{roomNumber}}",
  "{{rent}}",
  "{{deposit}}",
  "{{contractStart}}",
  "{{contractEnd}}",
  "{{dormName}}",
  "{{today}}",
];

export default function ContractTemplatesClient({
  templates,
}: {
  templates: TemplateRow[];
}) {
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <button
        onClick={() => setAdding(true)}
        className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2.5 rounded-xl transition"
      >
        + สร้างเทมเพลต
      </button>

      <div className="mt-6 space-y-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setEditing(t)}
            className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-brand-200 hover:shadow transition flex items-center gap-3"
          >
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-slate-50 text-slate-500 shrink-0">
              📑
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-800 flex items-center gap-2">
                {t.name}
                {t.isDefault && <Badge tone="green">ค่าเริ่มต้น</Badge>}
              </div>
              <div className="text-sm text-slate-400 truncate">
                {t.body.replace(/\s+/g, " ").trim().slice(0, 90) || "—"}
              </div>
            </div>
          </button>
        ))}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="สร้างเทมเพลตสัญญา">
        <form
          action={async (fd) => {
            await createTemplate(fd);
            setAdding(false);
          }}
          className="space-y-4"
        >
          <TemplateFields />
          <SaveButton className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl">
            บันทึก
          </SaveButton>
        </form>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="แก้ไขเทมเพลตสัญญา"
      >
        {editing && (
          <form
            action={async (fd) => {
              await updateTemplate(fd);
              setEditing(null);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={editing.id} />
            <TemplateFields tpl={editing} />
            <div className="flex items-center gap-2">
              <SaveButton className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl">
                บันทึก
              </SaveButton>
              <button
                type="submit"
                formAction={async (fd) => {
                  if (!confirm("ลบเทมเพลตนี้?\nเมื่อลบแล้วไม่สามารถย้อนกลับได้")) return;
                  await deleteTemplate(fd);
                  setEditing(null);
                }}
                className="px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 font-medium transition"
              >
                ลบ
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

function TemplateFields({ tpl }: { tpl?: TemplateRow }) {
  return (
    <>
      <Input label="ชื่อเทมเพลต" name="name" defaultValue={tpl?.name} required />
      <Textarea
        label="เนื้อหาสัญญา"
        name="body"
        defaultValue={tpl?.body ?? ""}
        rows={10}
        placeholder="พิมพ์เนื้อหาสัญญา ใช้ตัวแปร เช่น {{tenantName}} เช่าห้อง {{roomNumber}} ค่าเช่า {{rent}} บาท…"
      />
      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
        <div className="font-medium text-slate-600 mb-1.5">ตัวแปรที่ใช้ได้ (merge field)</div>
        <div className="flex flex-wrap gap-1.5">
          {FIELDS.map((f) => (
            <code
              key={f}
              className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600"
            >
              {f}
            </code>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          name="isDefault"
          value="true"
          defaultChecked={tpl?.isDefault}
        />
        ตั้งเป็นเทมเพลตเริ่มต้น
      </label>
    </>
  );
}
