"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/login/actions";
import { canAccess, ROLE_LABEL } from "@/lib/permissions";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  children?: { href: string; label: string; icon: string }[];
};

const NAV: NavItem[] = [
  { href: "/", label: "ภาพรวม", icon: "📊" },
  { href: "/rooms", label: "ห้องพัก", icon: "🏠" },
  { href: "/tenants", label: "ผู้เช่า", icon: "👤" },
  { href: "/bookings", label: "การจอง", icon: "📅" },
  { href: "/meters", label: "จดมิเตอร์", icon: "🔢" },
  { href: "/invoices", label: "บิล", icon: "🧾" },
  { href: "/vehicles", label: "ยานพาหนะ", icon: "🚗" },
  { href: "/finance", label: "รายรับ-รายจ่าย", icon: "💰" },
  { href: "/inventory", label: "ทรัพย์สิน", icon: "🗄️" },
  { href: "/issues", label: "แจ้งซ่อม", icon: "🔧" },
  { href: "/parcels", label: "พัสดุ", icon: "📦" },
  { href: "/reports", label: "รายงาน", icon: "📈" },
  {
    href: "/settings",
    label: "ตั้งค่า",
    icon: "⚙️",
    children: [
      { href: "/settings", label: "ตั้งค่าทั่วไป", icon: "🔧" },
      { href: "/settings/rooms", label: "จัดการห้องพัก", icon: "🏗️" },
      { href: "/settings/contract", label: "เทมเพลตสัญญา", icon: "📑" },
      { href: "/staff", label: "พนักงาน", icon: "🧑‍💼" },
      { href: "/subscription", label: "แพ็กเกจ", icon: "💎" },
    ],
  },
];

export default function Sidebar({
  dormName,
  userName,
  role = "admin",
  alertCount = 0,
}: {
  dormName: string;
  userName: string;
  role?: string;
  alertCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // เมนูย่อยที่กางอยู่ — เริ่มต้นกางอัตโนมัติถ้าหน้าปัจจุบันอยู่ในกลุ่มนั้น
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const item of NAV) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        init[item.href] = true;
      }
    }
    return init;
  });
  const toggleMenu = (href: string) =>
    setOpenMenus((m) => ({ ...m, [href]: !m[href] }));

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const nav = NAV.filter((item) => canAccess(role, item.href)).map((item) => ({
    ...item,
    children: item.children?.filter((c) => canAccess(role, c.href)),
  }));

  return (
    <>
      {/* แถบบนสำหรับมือถือ */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-slate-100 px-4 h-14">
        <div className="font-bold text-brand-700 truncate">{dormName}</div>
        <div className="flex items-center gap-1">
          <Link
            href="/alerts"
            aria-label="การแจ้งเตือน"
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            🔔
            {alertCount > 0 && (
              <span className="absolute top-0 right-0 grid place-items-center min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {alertCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-slate-100"
            aria-label="เมนู"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-64 shrink-0 bg-white border-r border-slate-100 flex flex-col transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-bold text-brand-700">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-600 text-white">
                บ
              </span>
              บ้านพักดี
            </div>
            <Link
              href="/alerts"
              onClick={() => setOpen(false)}
              aria-label="การแจ้งเตือน"
              className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              🔔
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid place-items-center min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {alertCount}
                </span>
              )}
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-2 truncate">{dormName}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const hasChildren = !!item.children && item.children.length > 0;
            const isOpen = openMenus[item.href] ?? false;
            const rowClass = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive(item.href)
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-50"
            }`;
            return (
              <div key={item.href}>
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.href)}
                    aria-expanded={isOpen}
                    className={`w-full ${rowClass}`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    <span
                      className={`text-[10px] text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-90" : ""
                      }`}
                    >
                      ▶
                    </span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={rowClass}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )}
                {hasChildren && isOpen && (
                  <div className="mt-1 ml-5 pl-3 border-l border-slate-100 space-y-1">
                    {item.children!.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                          pathname === child.href
                            ? "bg-brand-50 text-brand-700 font-medium"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-sm">{child.icon}</span>
                        <span className="flex-1">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-2 text-sm text-slate-600 truncate">
            👋 {userName}
            <span className="text-xs text-slate-400">
              {" "}
              · {ROLE_LABEL[role] ?? role}
            </span>
          </div>
          <form action={logoutAction}>
            <button className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition">
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
