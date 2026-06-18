import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  // ตรวจว่ามีผู้ใช้จริง (ไม่ใช่แค่คุกกี้ค้าง) เพื่อกันลูป redirect เมื่อ uid ในคุกกี้ใช้ไม่ได้
  const user = await currentUser();
  if (user) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-brand-700">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-600 text-white">
              บ
            </span>
            บ้านพักดี
          </div>
          <p className="text-slate-500 mt-2 text-sm">
            ระบบบริหารหอพักที่ใช้ง่าย เป็นกันเอง
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
