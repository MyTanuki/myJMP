"use client";

import { useRouter } from "next/navigation";
import { BillDetail, RoomLine, Preset } from "../InvoicesClient";

// ห่อ BillDetail สำหรับหน้าเต็ม — ปิด/ลบแล้วกลับไปหน้ารายการบิล
export default function BillPageClient({
  line,
  period,
  presets,
  lateFeePerDay,
  dueDay,
  backHref,
}: {
  line: RoomLine;
  period: string;
  presets: Preset[];
  lateFeePerDay: number;
  dueDay: number | null;
  backHref: string;
}) {
  const router = useRouter();
  return (
    <BillDetail
      line={line}
      period={period}
      presets={presets}
      lateFeePerDay={lateFeePerDay}
      dueDay={dueDay}
      onDone={() => router.push(backHref)}
    />
  );
}
