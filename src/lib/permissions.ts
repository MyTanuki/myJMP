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

export const ROLE_LABEL: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  manager: "ผู้จัดการ",
  staff: "พนักงาน",
};
