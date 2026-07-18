import { PageHeader } from "@/components/ui";
import SettingsTabs from "./SettingsTabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHeader
        title="ตั้งค่าหอพัก"
        subtitle="ปรับข้อมูลหอพักและพารามิเตอร์ต่างๆ ได้จากที่เดียว"
      />
      <SettingsTabs />
      {children}
    </>
  );
}
