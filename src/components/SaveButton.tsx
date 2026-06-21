"use client";

import { useEffect, useRef, useState } from "react";

function serialize(form: HTMLFormElement) {
  return JSON.stringify([...new FormData(form).entries()]);
}

// ปุ่มบันทึกที่จาง (opacity) เมื่อข้อมูลในฟอร์มยังไม่ถูกแก้ไข และกลับเป็นสีปกติเมื่อมีการแก้ไขที่ยังไม่บันทึก
export default function SaveButton({
  children = "บันทึก",
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const initial = useRef<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const recheck = () => {
    const form = ref.current?.closest("form");
    if (form && initial.current !== null) {
      setDirty(serialize(form) !== initial.current);
    }
  };

  // เทียบทุก render — จับการเปลี่ยนผ่าน React controlled (ปฏิทิน/autofill ฯลฯ)
  useEffect(() => {
    recheck();
  });

  // ตั้งค่าเริ่มต้น + ฟัง event ของช่องธรรมดา + reset หลังกดบันทึก
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    initial.current = serialize(form);
    recheck();
    const onInput = () => recheck();
    const onSubmit = () => {
      initial.current = serialize(form);
      setDirty(false);
    };
    form.addEventListener("input", onInput);
    form.addEventListener("change", onInput);
    form.addEventListener("submit", onSubmit);
    return () => {
      form.removeEventListener("input", onInput);
      form.removeEventListener("change", onInput);
      form.removeEventListener("submit", onSubmit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      ref={ref}
      className={`${className} ${dirty ? "" : "opacity-50"} transition`}
    >
      {children}
    </button>
  );
}
