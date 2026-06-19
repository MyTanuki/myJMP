// สิทธิ์การเข้าถึงตามบทบาท — โมดูลบริสุทธิ์ (ใช้ได้ทั้งฝั่ง client และ server)

export type Role = "admin" | "manager" | "staff";

// เส้นทางที่จำกัดสิทธิ์ — ที่ไม่ระบุไว้ = เข้าถึงได้ทุกบทบาท
const RULES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/staff", roles: ["admin"] },
  { prefix: "/subscription", roles: ["admin"] },
  { prefix: "/settings", roles: ["admin"] },
  { prefix: "/finance", roles: ["admin", "manager"] },
  { prefix: "/reports", roles: ["admin", "manager"] },
];

export function canAccess(role: string, path: string): boolean {
  const rule = RULES.find(
    (r) => path === r.prefix || path.startsWith(r.prefix + "/")
  );
  if (!rule) return true;
  return rule.roles.includes(role as Role);
}

// อาคารที่ผู้ใช้เข้าถึงได้ — คืนค่า null = ทุกอาคาร (ไม่จำกัด)
// admin เข้าถึงทุกอาคารเสมอ; buildingAccess ว่าง/ไม่กำหนด = ทุกอาคาร
export function allowedBuildings(
  role: string,
  buildingAccess: string | null | undefined
): string[] | null {
  if (role === "admin") return null;
  if (!buildingAccess) return null;
  try {
    const arr = JSON.parse(buildingAccess);
    if (Array.isArray(arr) && arr.length > 0) return arr.map(String);
    return null;
  } catch {
    return null;
  }
}

// where-clause กรองตามอาคาร (ใช้ฝั่ง server) — คืน {} ถ้าไม่จำกัด (allowed=null)
// สำหรับ query ตาราง Room โดยตรง
export function buildingWhere(allowed: string[] | null) {
  return allowed ? { building: { in: allowed } } : {};
}
// สำหรับ entity ที่อ้างห้องแบบบังคับ (roomId required) เช่น Tenant
export function roomBuildingWhere(allowed: string[] | null) {
  return allowed ? { room: { building: { in: allowed } } } : {};
}
// สำหรับ entity ที่ roomId เป็น null ได้ — ให้เห็นรายการที่ยังไม่ผูกห้องด้วย
export function roomBuildingWhereNullable(allowed: string[] | null) {
  return allowed
    ? { OR: [{ room: { building: { in: allowed } } }, { roomId: null }] }
    : {};
}

export const ROLE_LABEL: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  manager: "ผู้จัดการ",
  staff: "พนักงาน",
};
