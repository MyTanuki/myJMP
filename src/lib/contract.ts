// แทนที่ตัวแปรในเนื้อหาสัญญา — ใช้ทั้งหน้าพิมพ์และตัวอย่างในตัวแก้ไข
import { thaiDate, baht, roomLabel } from "./format";

export type ContractContext = {
  dormName: string;
  dormAddress: string | null;
  tenantName: string;
  tenantAddress: string | null;
  tenantIdCard: string | null;
  tenantPhone: string | null;
  roomLabel: string;
  rent: number;
  deposit: number;
  contractStart: Date | string | null;
  contractEnd: Date | string | null;
  contractMonths: number | null;
};

export function fillContract(body: string, c: ContractContext): string {
  const now = new Date();
  const map: Record<string, string> = {
    "{ชื่อหอพัก}": c.dormName,
    "{ที่อยู่หอพัก}": c.dormAddress ?? "-",
    "{วันที่ปัจจุบัน}": thaiDate(now),
    "{เดือน/ปีปัจจุบัน}": now.toLocaleDateString("th-TH", {
      month: "long",
      year: "numeric",
    }),
    "{ชื่อผู้เช่า}": c.tenantName,
    "{ที่อยู่ผู้เช่า}": c.tenantAddress ?? "-",
    "{หมายเลขบัตรประชาชนผู้เช่า}": c.tenantIdCard ?? "-",
    "{เบอร์โทรผู้เช่า}": c.tenantPhone ?? "-",
    "{เลขห้อง}": c.roomLabel,
    "{ค่าเช่า}": baht(c.rent),
    "{เงินประกัน}": baht(c.deposit),
    "{วันที่ทำสัญญา}": thaiDate(c.contractStart),
    "{วันที่สิ้นสุดสัญญา}": thaiDate(c.contractEnd),
    "{ระยะเวลาสัญญา}":
      c.contractMonths != null ? `${c.contractMonths} เดือน` : "-",
  };
  let out = body;
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v);
  return out;
}

export const CONTRACT_PLACEHOLDERS = [
  "{ชื่อหอพัก}",
  "{ที่อยู่หอพัก}",
  "{วันที่ปัจจุบัน}",
  "{เดือน/ปีปัจจุบัน}",
  "{ชื่อผู้เช่า}",
  "{ที่อยู่ผู้เช่า}",
  "{หมายเลขบัตรประชาชนผู้เช่า}",
  "{เบอร์โทรผู้เช่า}",
  "{เลขห้อง}",
  "{ค่าเช่า}",
  "{เงินประกัน}",
  "{วันที่ทำสัญญา}",
  "{วันที่สิ้นสุดสัญญา}",
  "{ระยะเวลาสัญญา}",
];

export { roomLabel };
