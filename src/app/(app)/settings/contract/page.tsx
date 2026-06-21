import { db } from "@/lib/db";
import { requireAccess } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui";
import ContractTemplatesClient from "./ContractTemplatesClient";

export default async function ContractTemplatesPage() {
  await requireAccess("/settings/contract");
  const templates = await db.contractTemplate.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="เทมเพลตสัญญา"
        subtitle="สร้างและจัดการแม่แบบสัญญาเช่า เลือกเทมเพลตเริ่มต้นได้"
      />
      <ContractTemplatesClient
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          body: t.body,
          isDefault: t.isDefault,
        }))}
      />
      {templates.length === 0 && (
        <EmptyState
          icon="📑"
          title="ยังไม่มีเทมเพลตสัญญา"
          hint="กด “สร้างเทมเพลต” เพื่อเริ่มต้น"
        />
      )}
    </>
  );
}
