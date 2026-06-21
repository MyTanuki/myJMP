"use client";

import { useEffect, useRef, useState } from "react";

// ตัวแปร (merge field) ที่คลิกแทรกในเนื้อหาสัญญา — แทนค่าจริงตอนพิมพ์สัญญา (ทำขั้นถัดไป)
const FIELDS = [
  "ชื่อหอพัก",
  "ที่อยู่หอพัก",
  "วันที่ปัจจุบัน",
  "เดือน/ปีปัจจุบัน",
  "ชื่อผู้เช่า",
  "ที่อยู่ผู้เช่า",
  "หมายเลขบัตรประชาชนผู้เช่า",
  "เบอร์โทรผู้เช่า",
  "หมายเลขห้องพัก",
  "หมายเลขชั้นห้องพัก",
  "ระยะเวลาสัญญา",
  "วันที่เริ่มต้นสัญญา",
  "วันที่สิ้นสุดสัญญา",
  "เงินประกันห้อง",
  "เงินประกันห้องภาษาไทย",
  "ค่าเช่าห้อง",
  "ค่าเช่าห้องภาษาไทย",
  "ค่าเช่าเฟอร์นิเจอร์",
  "ค่าเช่าเฟอร์นิเจอร์ภาษาไทย",
  "ค่าเช่าห้องรวมค่าเฟอร์นิเจอร์",
  "ค่าเช่าห้องไม่รวมค่าเฟอร์นิเจอร์ภาษาไทย",
  "วันที่สิ้นสุดการชำระเงิน",
  "เลขมิเตอร์ไฟฟ้าเข้าพัก",
  "เลขมิเตอร์น้ำเข้าพัก",
  "ลายเซ็นผู้เช่า",
];

const SIZES = ["12", "14", "16", "18", "20", "24", "28", "32"];

export default function RichTextEditor({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [html, setHtml] = useState(defaultValue);

  // ใส่เนื้อหาเริ่มต้นครั้งเดียว (uncontrolled — React จะไม่รีเซ็ตทับตอนพิมพ์)
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = defaultValue;
    setHtml(defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // แจ้ง SaveButton ว่าค่าฟอร์มเปลี่ยน (ปุ่มบันทึกจะเปลี่ยนจากจาง→ปกติ)
  useEffect(() => {
    hiddenRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [html]);

  const sync = () => setHtml(ref.current?.innerHTML ?? "");

  const saveSel = () => {
    const s = window.getSelection();
    if (s && s.rangeCount && ref.current?.contains(s.anchorNode)) {
      savedRange.current = s.getRangeAt(0);
    }
  };
  const restoreSel = () => {
    const s = window.getSelection();
    if (s && savedRange.current) {
      s.removeAllRanges();
      s.addRange(savedRange.current);
    }
  };

  const exec = (cmd: string, value?: string) => {
    ref.current?.focus();
    restoreSel();
    document.execCommand(cmd, false, value);
    sync();
  };

  const hilite = (color: string) => {
    ref.current?.focus();
    restoreSel();
    if (!document.execCommand("hiliteColor", false, color)) {
      document.execCommand("backColor", false, color);
    }
    sync();
  };

  const insertField = (label: string) => {
    ref.current?.focus();
    restoreSel();
    document.execCommand("insertText", false, `{${label}}`);
    sync();
  };

  // ขนาดอักษรแบบ px (execCommand fontSize รองรับแค่ 1-7 จึงห่อ span เอง)
  const applyFontSize = (px: string) => {
    if (!px) return;
    ref.current?.focus();
    restoreSel();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.getRangeAt(0).collapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontSize = `${px}px`;
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
    } catch {
      /* การเลือกข้ามหลาย element — ข้าม */
    }
    sync();
  };

  const tbtn = (title: string, onClick: () => void, child: React.ReactNode) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="min-w-8 h-8 px-1.5 grid place-items-center rounded hover:bg-slate-200 text-slate-600 text-sm"
    >
      {child}
    </button>
  );

  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">คลิกเพื่อใส่ข้อมูล</div>
      <div className="flex flex-wrap gap-1.5 mb-2 max-h-28 overflow-y-auto">
        {FIELDS.map((f) => (
          <button
            key={f}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertField(f)}
            className="px-2 py-1 rounded-md bg-brand-50 text-brand-700 text-xs hover:bg-brand-100"
          >
            {`{${f}}`}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-0.5 border border-slate-200 rounded-t-xl bg-slate-50 px-2 py-1">
        {tbtn("ย้อนกลับ", () => exec("undo"), "↶")}
        {tbtn("ทำซ้ำ", () => exec("redo"), "↷")}
        <span className="w-px h-5 bg-slate-200 mx-1" />
        {tbtn("ตัวหนา", () => exec("bold"), <b>B</b>)}
        {tbtn("ตัวเอียง", () => exec("italic"), <i>I</i>)}
        {tbtn("ขีดเส้นใต้", () => exec("underline"), <u>U</u>)}
        {tbtn("ล้างรูปแบบ", () => exec("removeFormat"), "⌫")}
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <select
          title="ขนาดอักษร"
          onMouseDown={saveSel}
          defaultValue=""
          onChange={(e) => {
            applyFontSize(e.target.value);
            e.target.value = "";
          }}
          className="h-8 rounded border border-slate-200 bg-white text-sm px-1 text-slate-600"
        >
          <option value="" disabled>
            ขนาด
          </option>
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label
          title="สีตัวอักษร"
          onMouseDown={saveSel}
          className="w-8 h-8 grid place-items-center rounded hover:bg-slate-200 cursor-pointer relative"
        >
          <span className="text-sm font-bold underline decoration-2 decoration-red-500">
            A
          </span>
          <input
            type="color"
            onChange={(e) => exec("foreColor", e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <label
          title="สีไฮไลต์"
          onMouseDown={saveSel}
          className="w-8 h-8 grid place-items-center rounded hover:bg-slate-200 cursor-pointer relative"
        >
          <span className="text-sm font-bold bg-yellow-200 px-0.5 rounded">A</span>
          <input
            type="color"
            onChange={(e) => hilite(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        {tbtn("หัวข้อย่อย", () => exec("insertUnorderedList"), "•≡")}
        {tbtn("ลำดับเลข", () => exec("insertOrderedList"), "1.≡")}
        <span className="w-px h-5 bg-slate-200 mx-1" />
        {tbtn("ชิดซ้าย", () => exec("justifyLeft"), "⬅")}
        {tbtn("กึ่งกลาง", () => exec("justifyCenter"), "↔")}
        {tbtn("ชิดขวา", () => exec("justifyRight"), "➡")}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onKeyUp={saveSel}
        onMouseUp={saveSel}
        className="min-h-[280px] max-h-[420px] overflow-y-auto border border-t-0 border-slate-200 rounded-b-xl bg-white px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-200 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
      />
      <input ref={hiddenRef} type="hidden" name={name} value={html} readOnly />
    </div>
  );
}
