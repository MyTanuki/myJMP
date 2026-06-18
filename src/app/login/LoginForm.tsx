"use client";

import { useActionState, useState } from "react";
import { loginAction, registerAction, type AuthState } from "./actions";

export default function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {}
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 py-2 rounded-lg transition ${
            mode === "login" ? "bg-white shadow text-brand-700" : "text-slate-500"
          }`}
        >
          เข้าสู่ระบบ
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 py-2 rounded-lg transition ${
            mode === "register"
              ? "bg-white shadow text-brand-700"
              : "text-slate-500"
          }`}
        >
          สมัครใหม่
        </button>
      </div>

      <form action={formAction} className="space-y-4">
        {mode === "register" && (
          <>
            <Field label="ชื่อเจ้าของหอ" name="name" placeholder="เช่น สมชาย" />
            <Field
              label="ชื่อหอพัก"
              name="dormName"
              placeholder="เช่น บ้านสวนเรสซิเดนซ์"
            />
          </>
        )}
        <Field
          label="อีเมล"
          name="email"
          type="email"
          placeholder="you@example.com"
        />
        <Field
          label="รหัสผ่าน"
          name="password"
          type="password"
          placeholder="••••••••"
        />

        {state.error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          disabled={pending}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition"
        >
          {pending
            ? "กำลังดำเนินการ..."
            : mode === "login"
              ? "เข้าสู่ระบบ"
              : "สร้างบัญชี"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
      />
    </label>
  );
}
