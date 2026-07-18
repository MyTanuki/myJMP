import { db } from "@/lib/db";
import { currentUser, requireAccess } from "@/lib/auth";
import { Section } from "../ui";
import PresetsClient from "../PresetsClient";

export default async function SettingsServicesPage() {
  await requireAccess("/settings");
  const user = await currentUser();
  if (!user) return null;

  const presets = await db.servicePreset.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-xl space-y-4">
      <Section title="รายการบริการ / ค่าใช้จ่ายที่ใช้บ่อย">
        <PresetsClient presets={presets} />
      </Section>
    </div>
  );
}
