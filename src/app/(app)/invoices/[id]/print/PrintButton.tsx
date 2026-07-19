"use client";

import Link from "next/link";

export default function PrintButton({
  backHref,
  label = "พิมพ์บิล",
}: {
  backHref: string;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4 print:hidden">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-700 transition"
      >
        ← กลับ
      </Link>
      <button
        onClick={() => window.print()}
        className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-xl transition"
      >
        🖨️ {label}
      </button>
    </div>
  );
}
