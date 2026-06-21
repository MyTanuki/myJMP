import Link from "next/link";

// แถบปุ่มกลับไปหน้ารายละเอียดห้อง — แสดงเมื่อหน้านั้นถูกเปิดจากห้อง (?room=<id>)
export default function BackToRoom({ id, label }: { id: string; label: string }) {
  return (
    <Link
      href={`/rooms/${id}`}
      className="inline-flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-700 transition"
    >
      ← กลับไปห้อง {label}
    </Link>
  );
}
