"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/settings", label: "ข้อมูลหอพัก", icon: "🏠" },
  { href: "/settings/bill", label: "บิล", icon: "🧾" },
  { href: "/settings/contract", label: "สัญญาเช่า", icon: "📑" },
  { href: "/settings/rooms", label: "ผังห้อง", icon: "🏗️" },
  { href: "/settings/rates", label: "ค่าน้ำ-ค่าไฟ", icon: "⚡" },
  { href: "/settings/services", label: "ค่าบริการ", icon: "🧺" },
  { href: "/settings/penalty", label: "ค่าปรับ", icon: "⏰" },
  { href: "/settings/bank", label: "บัญชีธนาคาร", icon: "🏦" },
];

export default function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6 -mx-1 overflow-x-auto">
      <div className="flex gap-2 px-1 pb-1 w-max">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition border ${
                active
                  ? "bg-brand-600 border-brand-600 text-white shadow"
                  : "bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {t.icon} {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
