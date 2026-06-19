export function baht(n: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function num(n: number): string {
  return new Intl.NumberFormat("th-TH").format(n || 0);
}

export function thaiDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

export function thaiMonth(period: string): string {
  // period = "YYYY-MM"
  const [y, m] = period.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
}

export type RentParts = {
  basePrice: number;
  rentFurniture: number;
  rentCommon: number;
  rentAircon: number;
  rentFridge: number;
  rentTv: number;
  rentDiscount: number;
};

// ป้ายห้องแบบไม่กำกวม — เลขห้องซ้ำได้ข้ามอาคาร จึงนำอาคารมานำหน้า เช่น "A-101"
export function roomLabel(
  building: string | null | undefined,
  number: string
): string {
  return building ? `${building}-${number}` : number;
}

// ค่าเช่ารวมต่อเดือน = ผลรวมค่าเช่าทุกส่วน หักส่วนลด
export function monthlyRent(r: RentParts): number {
  return (
    (r.basePrice || 0) +
    (r.rentFurniture || 0) +
    (r.rentCommon || 0) +
    (r.rentAircon || 0) +
    (r.rentFridge || 0) +
    (r.rentTv || 0) -
    (r.rentDiscount || 0)
  );
}

// ตัดข้อความให้พอดีความกว้างกล่อง — เกินจะซ่อนและแทนสองตัวท้ายด้วย ..\"
export function clipText(s: string, max: number): string {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 2)) + '..”';
}

export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export type InvoiceCalc = {
  rent: number;
  waterUnits: number;
  waterCost: number;
  elecUnits: number;
  elecCost: number;
  other: number;
  total: number;
};

export function calcInvoice(i: {
  rent: number;
  prevWater: number;
  currWater: number;
  prevElec: number;
  currElec: number;
  waterRate: number;
  elecRate: number;
  other: number;
  items?: { amount: number }[];
}): InvoiceCalc {
  const waterUnits = Math.max(0, i.currWater - i.prevWater);
  const elecUnits = Math.max(0, i.currElec - i.prevElec);
  const waterCost = waterUnits * i.waterRate;
  const elecCost = elecUnits * i.elecRate;
  const itemsTotal = (i.items ?? []).reduce((s, it) => s + (it.amount || 0), 0);
  const total = i.rent + waterCost + elecCost + i.other + itemsTotal;
  return {
    rent: i.rent,
    waterUnits,
    waterCost,
    elecUnits,
    elecCost,
    other: i.other,
    total,
  };
}

export type OverdueInfo = {
  overdue: boolean;
  daysLate: number;
  lateFee: number;
};

// คำนวณสถานะเกินกำหนดและค่าปรับ (ค่าปรับเป็นยอดที่คำนวณสด ไม่ได้เก็บใน DB)
export function overdueInfo(
  inv: { status: string; dueDate: string | Date | null },
  lateFeePerDay: number,
  now: Date = new Date()
): OverdueInfo {
  if (inv.status === "paid" || !inv.dueDate) {
    return { overdue: false, daysLate: 0, lateFee: 0 };
  }
  const due = new Date(inv.dueDate);
  // เทียบเฉพาะวัน (ตัดเวลาออก)
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ms = today.getTime() - dueDay.getTime();
  const daysLate = Math.floor(ms / 86400000);
  if (daysLate <= 0) return { overdue: false, daysLate: 0, lateFee: 0 };
  return {
    overdue: true,
    daysLate,
    lateFee: Math.max(0, daysLate * (lateFeePerDay || 0)),
  };
}
